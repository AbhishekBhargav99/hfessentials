const express = require('express');
const router = express.Router();

const network = require('../../patient-assets/application-javascript/app.js')

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
    console.log(hospitalid, adminid);
    
    const networkObj = await network.connectToNetwork(adminid,hospId);
    const response = await network.getAllDoctorsByHospitalId(networkObj, hospId);
    // console.log(response);
    res.status(200).send(response);
})

module.exports = router;