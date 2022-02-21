/*
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

let Patient = require('./Patient.js');
const crypto = require('crypto');
const PrimaryContract = require('./primary-contract.js');
const { Context } = require('fabric-contract-api');

class PatientContract extends PrimaryContract {
    //Read patient details based on patientId
    async readPatient(ctx, patientId) {
        return await super.readPatient(ctx, patientId);
    }

    //Delete patient from the ledger based on patientId
    async deletePatient(ctx, patientId) {
        const exists = await this.patientExists(ctx, patientId);
        if (!exists) {
            throw new Error(`The patient ${patientId} does not exist`);
        }
        await ctx.stub.deleteState(patientId);
    }

    //This function is to update patient personal details. This function should be called by patient.
    async updatePatientPersonalDetails(ctx, args) {
        args = JSON.parse(args);
        let isDataChanged = false;
        let patientId = args.patientId;
        // let newFirstname = args.firstName;
        // let newLastName = args.lastName;
        let newemail = args.email;
        // let newAge = args.age;
        let updatedBy = args.changedBy;
        let newPhoneNumber = args.phoneNumber;
        let newEmergPhoneNumber = args.emergPhoneNumber;
        let newAddress = args.address;
        // let newAllergies = args.allergies;

        const patient = await this.readPatient(ctx, patientId)
        // if (newFirstname !== null && newFirstname !== '' && patient.firstName !== newFirstname) {
        //     patient.firstName = newFirstname;
        //     isDataChanged = true;
        // }

        // if (newLastName !== null && newLastName !== '' && patient.lastName !== newLastName) {
        //     patient.lastName = newLastName;
        //     isDataChanged = true;
        // }

        // if (newAge !== null && newAge !== '' && patient.age !== newAge) {
        //     patient.age = newAge;
        //     isDataChanged = true;
        // }

        if (updatedBy !== null && updatedBy !== '') {
            patient.changedBy = updatedBy;
        }

        if (newPhoneNumber !== null && newPhoneNumber !== '' && patient.phoneNumber !== newPhoneNumber) {
            patient.phoneNumber = newPhoneNumber;
            isDataChanged = true;
        }

        if (newEmergPhoneNumber !== null && newEmergPhoneNumber !== '' && patient.emergPhoneNumber !== newEmergPhoneNumber) {
            patient.emergPhoneNumber = newEmergPhoneNumber;
            isDataChanged = true;
        }

        if (newAddress !== null && newAddress !== '' && patient.address !== newAddress) {
            patient.address = newAddress;
            isDataChanged = true;
        }

        // if (newAllergies !== null && newAllergies !== '' && patient.allergies !== newAllergies) {
        //     patient.allergies = newAllergies;
        //     isDataChanged = true;
        // }

        if (newemail !== null && newemail !== '' && patient.email !== newemail) {
            patient.email = newemail;
            isDataChanged = true;
        }

        if (isDataChanged === false) return;

        const buffer = Buffer.from(JSON.stringify(patient));
        await ctx.stub.putState(patientId, buffer);
    }

    //This function is to update patient password. This function should be called by patient.
    async updatePatientPassword(ctx, args) {
        args = JSON.parse(args);
        let patientId = args.patientId;
        let newPassword = args.newPassword;
        let email = args.email;

        const exists = await this.patientExists(ctx, patientId);
        if (!exists) {
            throw new Error(`The patient ${patientId} does not exist`);
        }

        const patient = await this.readPatient(ctx, patientId);
        if(email === null || email === '' || email !== patient.email ){
            throw new Error('Email is not Valid');
        }

        if (newPassword === null || newPassword === '') {
            throw new Error(`Empty or null values should not be passed for newPassword parameter`);
        }

        patient.password = crypto.createHash('sha256').update(newPassword).digest('hex');

        if(patient.newPatient){
            patient.newPatient = false;
            patient.changedBy = patientId;
        }
        const buffer = Buffer.from(JSON.stringify(patient));
        await ctx.stub.putState(patientId, buffer);
    }

    //Returns the patient's password
    async getPatientPassword(ctx, patientId) {
        
        const exists = await this.patientExists(ctx, patientId);
        if (!exists) {
            throw new Error(`The patient ${patientId} does not exist`);
        }
        let patient = await this.readPatient(ctx, patientId);
        patient = ({
            password: patient.password,
            newPatient: patient.newPatient,
        })
        return patient;
    }

    //Retrieves patient medical history based on patientId
    async getPatientMedicalHistory(ctx, patientId) {
        const exists = await this.patientExists(ctx, patientId);
        if (!exists) {
            throw new Error(`The patient ${patientId} does not exist`);
        }
        let resultsIterator = await ctx.stub.getHistoryForKey(patientId);
        let asset = await this.getAllPatientResults(resultsIterator, true);
        return this.fetchLimitedFields(asset, true);
    }
    
    // Utitility Function for fetching limited fields
    fetchLimitedFields = (asset, includeTimeStamp = false) => {
        for (let i = 0; i < asset.length; i++) {
            const obj = asset[i];
            asset[i] = {
                patientId: obj.Key,
                firstName: obj.Record.firstName,
                lastName: obj.Record.lastName,
                // age: obj.Record.age,
                // address: obj.Record.address,
                // phoneNumber: obj.Record.phoneNumber,
                // emergPhoneNumber: obj.Record.emergPhoneNumber,
                bloodGroup: obj.Record.bloodGroup,
                allergies: obj.Record.allergies,
                symptoms: obj.Record.symptoms,
                diagnosis: obj.Record.diagnosis,
                treatment: obj.Record.treatment,
                followUp: obj.Record.followUp
            };
            if (includeTimeStamp) {
                asset[i].changedBy = obj.Record.changedBy;
                asset[i].Timestamp = obj.Timestamp;
            }
        }

        return asset;
    };

    // Agument will have patientid & docId
    async grantAccessToDoctor(ctx, args) {
        args = JSON.parse(args);
        let patientId = args.patientId;
        let doctorId = args.doctorId;

        // Get the patient asset from world state
        const patient = await this.readPatient(ctx, patientId);
        // unique doctorIDs in permissionGranted
        if (!patient.permissionGranted.includes(doctorId)) {
            patient.permissionGranted.push(doctorId);
            patient.changedBy = patientId;
        }
        const buffer = Buffer.from(JSON.stringify(patient));
        // Update the ledger with updated permissionGranted
        await ctx.stub.putState(patientId, buffer);
    };

    

    // Remove Doctor from permissions array
    async revokeAccessFromDoctor(ctx, args) {
        args = JSON.parse(args);
        let patientId = args.patientId;
        let doctorId = args.doctorId;

        // Get the patient asset from world state
        const patient = await this.readPatient(ctx, patientId);
        // Remove the doctor if existing
        if (patient.permissionGranted.includes(doctorId)) {
            patient.permissionGranted = patient.permissionGranted.filter(doctor => doctor !== doctorId);
            patient.changedBy = patientId;
        }
        const buffer = Buffer.from(JSON.stringify(patient));
        // Update the ledger with updated permissionGranted
        await ctx.stub.putState(patientId, buffer);
    };  
}

module.exports = PatientContract;