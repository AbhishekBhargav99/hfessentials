//  Redundant file


// const { RedisClient } = require('redis')
const client = require('./client');

async function main() {
    let hospId = 3;
    let userName = 'hosp3admin';
    let data = await client.getRedisClientData(hospId, userName);

    console.log("Data", data);
}
main();
