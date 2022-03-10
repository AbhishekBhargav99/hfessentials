const express = require('express');
const router = express.Router();
const client = require('../../testBackend/redisUtils/client');

const network = require('../../patient-assets/application-javascript/app.js')

async function userExists(userName){
    let d1 = await client.getRedisClientData(1, userName);
    let d2 = await client.getRedisClientData(2, userName);
    let d3 = await client.getRedisClientData(3, userName);
    return (!!d1 || !!d2 || !!d3);
}

router.get('/', (req, res)=> {
    console.log("HI");
    res.status(200).send("Hello World -- ")
})

router.get('/allPatients', async (req, res) => {
   
    const {hospitalid, adminid} = req.headers;
    const hospId = parseInt(hospitalid);

    const networkObj = await network. connectToNetwork(adminid, hospId);
    const response = await network.invoke(networkObj, true, 'AdminContract:queryAllPatients');
    const parsedResponse = await JSON.parse(response);
    // console.log("type : ", typeof(parsedResponse));
    // console.log(parsedResponse);
    res.status(200).send(parsedResponse);
})

router.get('/allDoctors', async (req, res) => {

    const {hospitalid, adminid} = req.headers;
    const hospId = parseInt(hospitalid);
    // console.log(hospitalid, adminid);
    
    const networkObj = await network.connectToNetwork(adminid,hospId);
    const response = await network.getAllDoctorsByHospitalId(networkObj, hospId);
    // console.log(response);
    res.status(200).send(response);
})

router.post('/newPatient', async(req, res) => {

    const {hospitalid, adminid} = req.headers;
    const hospId = parseInt(hospitalid);
    
    
    let networkObj = await network.connectToNetwork(adminid, hospId );
    let lastId = await network.invoke(networkObj, true, 'AdminContract:getLatestPatientId');
    lastId = lastId.toString().slice(3, 7)
    let patientId = 'PID' + ( parseInt(lastId) + 1) + (Math.random() + 1).toString(36).substring(8);
    let password = 'password';
    req.body.patientId = patientId;
    req.body.password = password;
    req.body.changedBy = adminid;

    const data = JSON.stringify(req.body);
    let argsData = [data];
    networkObj = await network.connectToNetwork(adminid, hospId);
    const createPatientRes = await network.invoke(networkObj, false, 'AdminContract:createPatient', argsData);

    if(createPatientRes.error){
        return res.status(401).json({error : 'Could Not add New Patient to Ledger'});
    }

    const userData = JSON.stringify({ 
        hospitalId: hospitalid,
        userId: patientId, 
        role: 'patient', 
        firstName: req.bodyfirstName,
        lastName: req.body.lastName,
    });
    const registerUserRes = await network.registerUser(userData);

    if(registerUserRes.error){
        return  res.status(402).json({error : 'Could Not add New Patient to Wallet'});
    }


    // console.log("headers: ", req.headers);
    // console.log("body : ", req.body);

    res.status(201).json({
        status: true,
        patientId : patientId,
        password: password,
    })
})

router.post('/newDoctor', async (req, res) => {

    const {hospitalid, adminid} = req.headers;
    const hospId = parseInt(hospitalid);
    // console.log("ids :", hospitalid, adminid);
    // console.log(req.body);

    if(await userExists(req.body.userId)){
        return res.status(409).json({
            status: false,
            message: "User Already Exists",
        })
    }

    req.body.role = 'doctor';
    req.body.hospitalId = hospitalid;
    const docData = JSON.stringify(req.body);
    console.log(docData);

    let data = {
        email: req.body.email,
        password: ("pass" + req.body.userId),
        hospitalId: hospitalid,
    }

    // console.log(data);

    try{
        await client.setRedisClientData( hospId, req.body.userId, JSON.stringify(data));
    } catch(err){
        console.log(err);
    }

    
    // await client.setRedisClientData(parseInt(hospId), req.body.id, JSON.stringify(data));
    const registerUserRes = await network.registerUser(docData);
    if(registerUserRes.error){
        console.log("Doctor registration failed");
    }
    // console.log(registerUserRes);

    res.status(201).json({
        status: true,
        doctorId : req.body.userId,
        password: data.password,
    })

})

module.exports = router;