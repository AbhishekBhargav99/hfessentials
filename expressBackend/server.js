const express = require('express')
const crypto = require('crypto');

const app = express()
const port = 3000
const adminRouter = require('./routes/adminRoutes');
const cors = require('cors');
const client = require('../testBackend/redisUtils/client');
const network = require('../patient-assets/application-javascript/app');


const ROLE_ADMIN = "admin";
const ROLE_PATIENT = "patient";
const ROLE_DOCTOR = "doctor";

// parse form data
app.use(express.urlencoded({extended: false}));
// parse json
app.use(express.json());
app.use(cors());


app.post('/login', async(req, res) => {
  // console.log("Hello World");
  const {username, password, hospitalId, role} = req.body;

  if(role === ROLE_ADMIN){
    const hospId = parseInt(hospitalId);
    let pWord = await client.getRedisClientData(hospId, username);
    // console.log(pWord);
    if(pWord === null || pWord !== password ){
      return res.status(401).json({"message" : "Incorrect Username or Password" })
    }

    return res.status(200).json({"message " : "Successfull Login"})
  }

  if(role === ROLE_DOCTOR){
    const hospId = parseInt(hospitalId);
    let data = await client.getRedisClientData(hospId, username);
    let jSOnData = JSON.parse(data);

    if(data === null || jSOnData.password !== password)
      return res.status(401).json({"message" : "Incorrect Username or Password" });
    
    return res.status(200).json({"message " : "Successfull Login"});
  }

  if(role === ROLE_PATIENT){
    console.log("patient");
    const hospId = parseInt(hospitalId);
    let pWord = crypto.createHash('sha256').update(password).digest('hex');
    const networkObj = await network.connectToNetwork(username, hospId);
    if(networkObj.error){
      // console.log("Error : ", networkObj.error);
      return res.status(401).json({"message" : "Patient does not exists in wallet" });
    }
    let response = await network.invoke(networkObj, true, "PatientContract:getPatientPassword", username);
    if(response.error){
      console.log("Error in resp :", response.error);
      return res.status(401).json({"message" : "Patient Doesnot exists" });
    }
    else{
        let data = JSON.parse(response.toString());

        // **** Change to data.newPatient=== true
        if(data.newPatient === true){
          return res.status(403).json({"message" : "New Patient should signup first"});
        }
        if(data.password === pWord)
            return res.status(200).json({"message " : "Successfull Login"});
        else{
            console.log("Invalid Credentials");
            return res.status(401).json({"message" : "Incorrect Username or Password" });
        }
        // console.log(data);
    }
   
  }

  return res.status(200).json({"message " : "Successfull Login"});
})


app.post('/signup', async(req, res) => {

})


app.use('/adminApi', adminRouter);


app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})