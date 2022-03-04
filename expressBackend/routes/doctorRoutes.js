const express = require('express');
const router = express.Router();
const client = require('../../testBackend/redisUtils/client');

const network = require('../../patient-assets/application-javascript/app.js')

router.get('/allPermissionedPatients', async(req, res) => {
    const {hospitalid, doctorid} = req.headers;
    const hospId = parseInt(hospitalid);
    const networkObj = await network.connectToNetwork(doctorid, hospId);
    const response = await network.invoke(networkObj, true, 'DoctorContract:queryAllPatients', doctorid);
    if(response.error){
        console.log(`Could not access doctor`);
        return res.status(404).send({"message":"Could Not Access the Patients"})
    }
    const parsedResponse = await JSON.parse(response)
    console.log(parsedResponse);

    res.status(200).send(parsedResponse);
})

router.patch('/:hospitalId/:doctorId/addRecords/:patientId', async (req, res) => {
    const { hospitalId, doctorId, patientId} = req.params;
    let hospId = parseInt(hospitalId);
    let args = {
        patientId: patientId,
        reasonsForVisit: req.body.reasonsForVisit,
        allergies: req.body.allergies,
        symptoms: req.body.symptoms,
        diagnosis: req.body.diagnosis,
        treatment: req.body.treatment,
        followUp: req.body.followUp,
        notes: req.body.notes,
        medication: req.body.medication,
        changedBy : doctorId,
    }
    args= [JSON.stringify(args)];
    const networkObj = await network.connectToNetwork(doctorId, hospId);
    const response = await network.invoke(networkObj, false, 'DoctorContract:updatePatientMedicalDetails', args)
    if(response.error){
        return res.status(401).send("Could not add Patient Data");
    }
    res.status(200).send({
        status: true,
        messgae: "Success"
    });
})


router.get('/getMedicalHistory', async(req, res) => {
    // return res.status(200).json({"hi" : "there"});
    const {hospitalid, doctorid, patientid} = req.headers;
    let hospId = parseInt(hospitalid);
    const networkObj = await network.connectToNetwork(doctorid, hospId);
    const response = await network.invoke(networkObj, true, 'DoctorContract:getPatientHistory', patientid);
    if(response.error){
        console.log(`Could not access patient Records`);
        return res.status(404).send({"message":"Could Not Access the Patient's Records"})
    }
    const parsedResponse = await JSON.parse(response)
    console.log('pr : ', parsedResponse);

    res.status(200).json(parsedResponse);
})





module.exports = router;