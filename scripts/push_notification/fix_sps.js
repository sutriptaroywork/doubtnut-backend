"use strict";
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const Flagr = require(__dirname+'/../../api_server/modules/Utility.flagr');
const database = require("./database");
const _ = require("lodash");

const conRead = config.mysql_write;
console.log(conRead)
const packageIDList = [13,14,15,16,17,18];
main(conRead);
// set2_trial3 = 99
// set1_trial4 = 250
async function main(conWrite) {
    try{
        const writeClient = new database(conWrite);
        // get sps affected rows
        const spsData = await getSpsData(writeClient, packageIDList);
        // console.log(spsData)
        // console.log(spsData.length);
        for (let i = 0; i < spsData.length; i++) {
            if(spsData[i].amount === 0){
                const studentId = spsData[i].student_id;
                const packageDuration = spsData[i].duration_in_days;
                const id = spsData[i].id
                //get flagr variant
                const flagrResponse = await Flagr.evaluate(studentId.toString(), {}, config.package_subscription_flagr_id, 500);

                const { variantAttachment } = flagrResponse;
                let amountToUpdate = variantAttachment.final_price[variantAttachment.package_duration.indexOf(packageDuration)];
                if (typeof amountToUpdate === 'undefined') {
                    if(flagrResponse.variantKey === 'set2_trial3'){
                        amountToUpdate = 99;
                    }
                    if(flagrResponse.variantKey === 'set1_trial4'){
                        amountToUpdate = 250;
                    }
                }
                console.log(amountToUpdate);
                console.log(id);
                await updateSpsAmount(writeClient, amountToUpdate, id)
            } else {
                console.log('fine')
            }
        }
        console.log('done')
    } catch (error) {
        console.log(error);
    }
}

function updateSpsAmount(client, amount, id){
    let query = `update student_package_subscription set amount = ${amount} where id = ${id}`;
    console.log(query)
    return client.query(query);

}

function getSpsData(client, packageIDList) {
    const query = `select a.student_id, a.id, b.duration_in_days, a.amount from (select * from student_package_subscription where student_package_id in (${packageIDList})) as a left join (select * from student_package) as b on a.student_package_id = b.id`;
    return client.query(query);
}
