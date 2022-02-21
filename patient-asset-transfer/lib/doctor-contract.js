/*
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

let Patient = require('./Patient.js');
const AdminContract = require('./admin-contract.js');
const PrimaryContract = require("./primary-contract.js");
const { Context } = require('fabric-contract-api');

class DoctorContract extends AdminContract {

    //Read patient details based on patientId
    async readPatient(ctx, patientId) {

        let asset = await PrimaryContract.prototype.readPatient(ctx, patientId)

        // Get the doctorID, retrieves the id used to connect the network
        const doctorId = await this.getClientId(ctx);
        // Check if doctor has the permission to read the patient
        const permissionArray = asset.permissionGranted;
        if(!permissionArray.includes(doctorId)) {
            throw new Error(`The doctor ${doctorId} does not have permission to patient ${patientId}`);
        }
        asset = ({
            patientId: patientId,
            firstName: asset.firstName,
            lastName: asset.lastName,
            age: asset.age,
            bloodGroup: asset.bloodGroup,
            allergies: asset.allergies,
            symptoms: asset.symptoms,
            diagnosis: asset.diagnosis,
            treatment: asset.treatment,
            followUp: asset.followUp
        });
        return asset;
    }

    //This function is to update patient medical details. This function should be called by only doctor.
    async updatePatientMedicalDetails(ctx, args) {
        args = JSON.parse(args);
        let isDataChanged = false;
        let patientId = args.patientId;
        let newSymptoms = args.symptoms;
        let newDiagnosis = args.diagnosis;
        let newTreatment = args.treatment;
        let newFollowUp = args.followUp;
        let newAllergies = args.allergies;
        let updatedBy = args.changedBy;

        
        const patient = await PrimaryContract.prototype.readPatient(ctx, patientId);
        const doctorId = await this.getClientId(ctx);
    
        const permissionArray = patient.permissionGranted;
        if(!permissionArray.includes(doctorId)) {
            throw new Error(`The doctor ${doctorId} does not have permission to patient ${patientId}`);
        }


        if (newSymptoms !== null && newSymptoms !== '' && patient.symptoms !== newSymptoms) {
            patient.symptoms = newSymptoms;
            isDataChanged = true;
        }

        if (newDiagnosis !== null && newDiagnosis !== '' && patient.diagnosis !== newDiagnosis) {
            patient.diagnosis = newDiagnosis;
            isDataChanged = true;
        }

        if (newTreatment !== null && newTreatment !== '' && patient.treatment !== newTreatment) {
            patient.treatment = newTreatment;
            isDataChanged = true;
        }

        if(newAllergies !== null && newAllergies !== '' && patient.allergies !== newAllergies){
            patient.allergies = newAllergies;
            isDataChanged = true;
        }

        if (newFollowUp !== null && newFollowUp !== '' && patient.followUp !== newFollowUp) {
            patient.followUp = newFollowUp;
            isDataChanged = true;
        }

        if (updatedBy !== null && updatedBy !== '') {
            patient.changedBy = updatedBy;
        }

        if (isDataChanged === false) return;

        const buffer = Buffer.from(JSON.stringify(patient));
        await ctx.stub.putState(patientId, buffer);
    }

    //Read patients based on lastname
    async queryPatientsByLastName(ctx, lastName) {
        return await super.queryPatientsByLastName(ctx, lastName);
    }

    //Read patients based on firstName
    async queryPatientsByFirstName(ctx, firstName) {
        return await super.queryPatientsByFirstName(ctx, firstName);
    }

    //Retrieves patient medical history based on patientId
    async getPatientHistory(ctx, patientId) {
        
        const patient = await PrimaryContract.prototype.readPatient(ctx, patientId);
        const doctorId = await this.getClientId(ctx);
    
        const permissionArray = patient.permissionGranted;
        if(!permissionArray.includes(doctorId)) {
            throw new Error(`The doctor ${doctorId} does not have permission to patient ${patientId}`);
        }
        let resultsIterator = await ctx.stub.getHistoryForKey(patientId);
        let asset = await this.getAllPatientResults(resultsIterator, true);

        return this.fetchLimitedFields(asset, true);
    }

    //Retrieves all patients details
    async queryAllPatients(ctx, doctorId) {
        let resultsIterator = await ctx.stub.getStateByRange('', '');
        let asset = await this.getAllPatientResults(resultsIterator, false);
        const permissionedAssets = [];
        for (let i = 0; i < asset.length; i++) {
            const obj = asset[i];
            if ('permissionGranted' in obj.Record && obj.Record.permissionGranted.includes(doctorId)) {
                permissionedAssets.push(asset[i]);
            }
        }

        return this.fetchLimitedFields(permissionedAssets);
    }

    fetchLimitedFields = (asset) => {
        for (let i = 0; i < asset.length; i++) {
            const obj = asset[i];
            asset[i] = {
                patientId: obj.Key,
                firstName: obj.Record.firstName,
                lastName: obj.Record.lastName,
                age: obj.Record.age,
                bloodGroup: obj.Record.bloodGroup,
                allergies: obj.Record.allergies,
                symptoms: obj.Record.symptoms,
                diagnosis: obj.Record.diagnosis,
                treatment: obj.Record.treatment,
                followUp: obj.Record.followUp
            };
        }

        return asset;
    };


    //  Get the client used to connect to the network
    async getClientId(ctx) {
        const clientIdentity = ctx.clientIdentity.getID();
        console.info(clientIdentity);
        // Ouput of the above - 'x509::/OU=client/CN=Doc-1::/C=US/ST=North Carolina/L=Durham/O=hosp1.ehrNet.com/CN=ca.hosp1.ehrNet.com'
        let identity = clientIdentity.split('::');
        identity = identity[1].split('/')[2].split('=');
        // ['CN', 'hosp1admin']
        return identity[1].toString('utf8');
    }
}
module.exports = DoctorContract;