const express = require('express');
const router = express.Router();

const network = require('../../patient-assets/application-javascript/app.js')

router.get('/', (req, res)=> {
    console.log("HI");
    res.status(200).send("Hello World -- ")
})

router.get('give', (req, res) => {
    console.log("HI");
    res.status(200).send("Hello World")
})

router.get('/all', async (req, res) => {
    console.log("Hi");
    const {hospitalid, adminid} = req.headers;
    const hospId = parseInt(hospitalid);

    const networkObj = await network. connectToNetwork(adminid, hospId);
    const response = await network.invoke(networkObj, true, 'AdminContract:queryAllPatients');
    const parsedResponse = await JSON.parse(response);
    console.log("Response : ", parsedResponse);
    res.status(200).send(parsedResponse);
})

module.exports = router;