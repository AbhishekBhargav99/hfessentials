const express = require('express');
const router = express.Router();
const client = require('../../testBackend/redisUtils/client');

const network = require('../../patient-assets/application-javascript/app.js')


router.get('/allDoctors', async (req, res) => {
    const {hospitalid} = req.headers;
    const hospId = parseInt(hospitalid);
    // console.log("Hospital Id : ", hospId);
    let userId = hospId === 1 ? 'hosp1admin' : hospId === 2 ? 'hosp2admin' : 'hosp3admin';
    const networkObj = await network.connectToNetwork(userId, hospId);
    const response = await network.getAllDoctorsByHospitalId(networkObj, hospId);
    // console.log(response);
    console.log(response);
    res.status(200).send(response);
})

router.get('/details', async(req, res) => {
    const {hospitalid, patientid} = req.headers;
    const hospId = parseInt(hospitalid);
    console.log(hospitalid, patientid);
    const args = patientid;
    const networkObj = await network.connectToNetwork(patientid, hospId);
    const response = await network.invoke(networkObj, true, 'PatientContract:getPatientPersonelDetails', args);
    const parsedRes = JSON.parse(response.toString())
    console.log(parsedRes);    
    res.status(200).send(parsedRes);
})

router.patch('/:hospitalId/:patientId/grant/:doctorId', async (req, res) => {
    const { hospitalId, patientId, doctorId} = req.params;
    const hospId = parseInt(hospitalId);
    // console.log(req.params);
    console.log(hospitalId, patientId, doctorId);

    let args = {
        patientId: patientId, 
        doctorId: doctorId
    };
    args = [JSON.stringify(args)];

    const networkObj = await network.connectToNetwork(patientId, hospId);
    const response = await network.invoke(networkObj, false, 'PatientContract:grantAccessToDoctor', args);
    
    if(response.error){
        res.status(401).json({
            message: "Could not grant Request",
        })
    }
    let parsedResponse = response.toString()
    res.status(200).send(parsedResponse)
})
router.patch('/:hospitalId/:patientId/revoke/:doctorId', async (req, res) => {
    const { hospitalId, patientId, doctorId} = req.params;
    const hospId = parseInt(hospitalId);
    // console.log(req.params);
    console.log(hospitalId, patientId, doctorId);

    let args = {
        patientId: patientId, 
        doctorId: doctorId
    };
    args = [JSON.stringify(args)];

    const networkObj = await network.connectToNetwork(patientId, hospId);
    const response = await network.invoke(networkObj, false, 'PatientContract:revokeAccessFromDoctor', args);
    
    if(response.error){
        res.status(401).json({
            message: "Could not grant Request",
        })
    }
    let parsedResponse = response.toString()
    res.status(200).send(parsedResponse)
})

router.get('/getHistory', async(req, res) => {
    const {hospitalid, patientid} = req.headers;
    const hospId = parseInt(hospitalid);
    console.log(hospId, patientid);
    const args = patientid;
    const networkObj = await network.connectToNetwork(patientid, hospId);
    const response = await network.invoke(networkObj, true, 'PatientContract:getPatientMedicalHistory', args);
    let parsedResponse = JSON.parse(response.toString());
    console.log(parsedResponse);
    res.status(200).send(parsedResponse)
    // res.status(200).send({"msg" : "Hi there"});

})


router.patch('/updatePatient/:hospitalId/:patientId', async( req, res) => {
    const {hospitalid, patientid} = req.headers;
    const hospId = parseInt(hospitalid);
    console.log(hospId, patientid);
    let args = {
        patientId : req.body.patientId,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        address: req.body.address,
        weight: req.body.weight,
        changedBy : patientid
    };
    args = [JSON.stringify(args)];
    const networkObj = await network.connectToNetwork(patientid, hospId);
    const response = await network.invoke(networkObj, false, 'PatientContract:updatePatientPersonalDetails', args);

    if(response.error){
        return res.status(401).send({
            status: false,
        })
    }

    res.status(200).send({
        status: true,
        message: "SuccessFull"
    })



})

module.exports = router

