const testContract = require('./testContracts');


async function main(){
    await testContract.lastPatientbyId();
}

main();