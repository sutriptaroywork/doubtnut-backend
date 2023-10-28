"use strict";
const _ = require('lodash');
require('dotenv').config({path : __dirname + '/../api_server/.env'});
const config = require(__dirname+'/../api_server/config/config');
const Database = require(__dirname+'/../api_server/config/database');
const RzpHelper = require(__dirname+'/../api_server/modules/razorpay/helper');
const PaytmpHelper = require(__dirname+'/../api_server/modules/paytm/helper');
const mysql = new Database(config.write_mysql);


async function getPaymentInfoByBountyId(id){
    const sql = `select * from payment_info where payment_for_id = ${id} and payment_for = 'bounty'`;
    return mysql.query(sql);
}

async function getNumbersToReturn(){
    const sql = "select a.student_id, a.bounty_id, a.bounty_amount, b.phone from bounty_post_detail a join payment_info_paytm b on a.student_id = b.student_id where a.bounty_amount > 0 and a.is_answered = 0 and a.is_delete = 0 and a.is_active = 1 and a.created_at >= DATE_SUB(CURDATE(),INTERVAL 1 DAY)"
    return mysql.query(sql);
}
async function insertBountyDisburse(obj){
    const sql = 'INSERT ignore INTO bounty_disbursement SET ?';
    return mysql.query(sql, obj);
}

async function updateBountyDisburseByBountyId(obj){
    const sql = `update bounty_disbursement SET ? where bounty_id = ${obj.bounty_id}`;
    return mysql.query(sql, obj);
}

async function getdisbursementDetail() {
    const sql = "select a.bounty_id, a.bounty_amount, b.student_id, b.answer_id, c.phone from  bounty_post_detail a join bounty_answer_detail b on a.bounty_id = b.bounty_id join payment_info_paytm c on b.student_id = c.student_id where  a.is_answered = 1 and (select datediff(b.created_at , a.created_at )) = 3 and a.is_delete = 0 and a.is_active = 1 and b.is_delete = 0 and a.bounty_amount > 0 and a.student_id <> b.student_id and b.bounty_id NOT IN (SELECT bounty_id from bounty_answer_detail where acceptance_flag = 1)"
    return mysql.query(sql)
}

async function returnForNoAnswer(){
    const returnNumbersDetail = await getNumbersToReturn();
/*

    const returnNumbersDetail = [{
      student_id : 8306072,
      phone:"",
      "bounty_id":241,
      amount_to_disburse:1,
      type:'return'
    }];
*/
    for(let i = 0; i<returnNumbersDetail.length; i++){
        const params = {
            student_id: returnNumbersDetail[i].student_id,
            phone: returnNumbersDetail[i].phone,
            bounty_id: returnNumbersDetail[i].bounty_id,
            amount_to_disburse: returnNumbersDetail[i].bounty_amount,
            type: 'return',
        
        }

        await insertBountyDisburse(params);
        let payment_info = await getPaymentInfoByBountyId(params.bounty_id);

        let partner_response;
        if(!_.isEmpty(payment_info))
        {
            if(payment_info[0].source == "RAZORPAY")
            {
                partner_response =     await RzpHelper.refund(payment_info[0].partner_txn_id,amount);
                params.partner_txn_id = partner_response.id;
                if(partner_response.status == "processed");
                {
                    params.status = "SUCCESS";
                }
            }

            else if (payment_info[0].source == "PAYTM")
            {
                partner_response = await PaytmpHelper.refund(payment_info[0].order_id, payment_info[0].partner_txn_id, payment_info[0].amount);

                console.log(partner_response);


                if(partner_response.body.resultInfo.resultStatus == "TXN_SUCCESS")
                {
                    params.status = "SUCCESS";
                }
                else if(partner_response.body.resultInfo.resultStatus == "PENDING")
                {
                    params.status = "PENDING";
                }

                else {
                    params.status = "FAILURE";

                }

            }

            param.partner_txn_response =  partner_response;

            await updateBountyDisburseByBountyId(params);

        }



    }
}

async function disburseForNotAccepted(){
    console.log('aaaaaaaaaa')
    const disbursementDetail = await getdisbursementDetail();
    console.log(disbursementDetail)
    // const obj = 
    let bountyMap = {};
    let obj = {};

    if(!Array.isArray(disbursementDetail) ) return

    disbursementDetail.forEach((obj)=>{
        let b = obj.bounty_id
        if(b in bountyMap){
            bountyMap[b].push(obj)
        }
        else{
            bountyMap[b] = []
            bountyMap[b].push(obj)
        }
    })
    
    const ids = Object.keys(bountyMap);

    for(let i = 0; i<ids.length; i++){
       let bid = ids[i];
       let bIdAnswers = bountyMap[bid];
       let bAmt = bIdAnswers[i].bounty_amount;
       let disburseAmt = (bAmt/bIdAnswers.length) * 0.9;
       for(let i = 0; i<bIdAnswers.length; i++){
           const params = {
               student_id: bIdAnswers[i].student_id,
               bounty_id: bIdAnswers[i].bounty_id,
               phone: bIdAnswers[i].phone,
               amount_to_disburse: disburseAmt,
               answer_id: bIdAnswers[i].answer_id,
               type: 'disbursed',
           }
           console.log('params', params)
           await insertBountyDisburse(params)
       }
    }    
    console.log('done')
}

async function main() {
    await returnForNoAnswer();
    // await disburseForNotAccepted();
    
    process.exit();
}

main()