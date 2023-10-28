"use strict";

const puppeteer = require('puppeteer')
const fs = require('fs')
const database = require('./database')
const { promisify } = require('util')
const readFileAsync = promisify(fs.readFile)
// const AWS = require('aws-sdk')
const _ = require('lodash')
const path = require('path')
 
const con = {
  //host: "test-db-cluster.cluster-cpymfjcydr4n.ap-south-1.rds.amazonaws.com",
  host:"dn-prod-db-cluster.cluster-cpymfjcydr4n.ap-south-1.rds.amazonaws.com",
  // host : "test-db.cpymfjcydr4n.ap-south-1.rds.amazonaws.com",
  user: "dn-prod",
  // user: "doubtnut",
  password: "D0ubtnut@2143",
  // password: "Iamlegend123king",
  database: "classzoo1",
  timezone: "UTC+0"
}

//
const mysql = new database(con)
let db


console.log('live class thumbnail')

function getAllTopics(mysql){
  // let sql = "SELECT c.*, d.duration FROM (SELECT b.live_at, a.q_order, a.expert_name, b.subject, a.resource_reference FROM `structured_course_resources` AS a LEFT JOIN structured_course_details AS b ON a.structured_course_detail_id = b.id WHERE a.id >= 25 AND a.resource_type = 0) AS c LEFT JOIN answers AS d ON c.resource_reference = d.question_id WHERE c.resource_reference > 100"
  let sql = "SELECT b.live_at, a.q_order, a.expert_name, b.subject, b.chapter, a.resource_reference FROM `structured_course_resources` AS a LEFT JOIN structured_course_details AS b ON a.structured_course_detail_id = b.id WHERE a.id >= 25 AND a.resource_type = 0 AND a.resource_reference > 100 AND a.class = 12"
  console.log(sql)
	return mysql.query(sql)
}

function titleCase (str) {
  return _.map(str.split(' '), _.upperFirst).join(' ');
}

function getMaxId(qid, mysql) {
  let sql = "SELECT MAX(answer_id) AS answer_id FROM answers WHERE question_id = "+qid
	return mysql.query(sql)
}

function getDuration(qid, ans_id, mysql) {
  let sql = "SELECT duration FROM answers WHERE question_id = "+qid+" AND answer_id = "+ans_id
	return mysql.query(sql)
}

async function main(mysql){
    try{
        const browser = await puppeteer.launch()
        const page = await browser.newPage()

        let monthList = [
          "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sept","Oct","Nov","Dec"
        ]
        
        await page.setViewport({
            width: 1340,
            height: 756,
            deviceScaleFactor: 1,
        })

        let allTopics = await getAllTopics(mysql)

        for(let i=0; i<allTopics.length; i++)
        {
            // console.log(allTopics[i])
            // console.log(allTopics[i].chapter)
            let duration = ""
            let maxId = await getMaxId(allTopics[i].resource_reference, mysql)

            if(maxId[0].answer_id != undefined)
            {
              duration = await getDuration(allTopics[i].resource_reference, maxId[0].answer_id, mysql)
            }
            let topic = allTopics[i].chapter
            let expert_name = allTopics[i].expert_name.toUpperCase()

            let imageArray =[], sample, image_name, screenshot_image, image_url
            let img_link
            if(expert_name.includes('KRISHAN'))
            {
              img_link = 'https://d10lpgp6xz60nq.cloudfront.net/images/Thumbnail_math.png'
            }
            else if(expert_name.includes('YAKSHU'))
            {
              img_link = 'https://d10lpgp6xz60nq.cloudfront.net/images/Thumbnail_chemistry.png'
            }
            else
            {
              img_link = 'https://d10lpgp6xz60nq.cloudfront.net/images/Thumbnail_physics.png'
            }
            let lectureText
            if(allTopics[i].q_order == 1)
              lectureText = "INTRODUCTION"
            else
              lectureText = "Lecture "+(allTopics[i].q_order-1)
            
            let liveAt = allTopics[i].live_at

            let liveDate = new Date(liveAt).getDate()
            let liveMonth = new Date(liveAt).getMonth()
            if(liveDate == 21 && liveMonth == 9)
            {
              liveDate = 22
            }
            // let liveAtArr = liveAt.toString().split(" ")
            // let liveDate = liveAtArr[2]
            // let liveMonth = liveAtArr[1]
            
            // let dateText = ""
            // if(allTopics[i].q_order != 1)
            // {
            //   dateText = liveDate+" "+monthList[liveMonth]
            // }
            let dateText = liveDate+" "+monthList[liveMonth]
            let timeText = ""
            console.log("QID ::: ",allTopics[i].resource_reference)
            console.log("dateText : ",dateText)
            console.log("live at : ",liveAt)
            console.log("live date : ",liveDate)
            console.log("live month : ",liveMonth)
            console.log("topic : ",_.startCase(topic.toLowerCase()))
            if(duration != "")
            {
              console.log("DURATION ::: ",duration[0].duration)
              if(duration[0].duration >= 60 && allTopics[i].q_order != 1)
                timeText = " | "+Math.round(duration[0].duration/60)+" MINUTES"
            }
            // console.log("timeText : ",timeText)
            let template= await readFileAsync('./fact-template-test.html','utf8')
            template =  template.replace('$',img_link)
            template =  template.replace('##', _.startCase(topic.toLowerCase()))
            template =  template.replace('#:', lectureText)
            template =  template.replace('#:$', dateText)
            template =  template.replace('#:$:', timeText)
            
            await page.setContent(template)
            image_name = allTopics[i].resource_reference+'.png';
            // image_name = '3.png';
            screenshot_image = await page.screenshot({path:  './images/'+ image_name ,type:"png"})
            // image_url = 'https://d10lpgp6xz60nq.cloudfront.net/q-thumbnail/'+image_name
            // sample ={}
            // sample.image = image_url
            // sample.file_name = image_name
            // sample.file_content = screenshot_image
            // imageArray.push(sample)
        }
        console.log('live class thumbnail')
        //mysql.close()
    }catch(e){
        console.log(e)
    }
}

main(mysql)



// module.exports = class refresh {

//     constructor() {


//     }

// static saveToMongo(userData){
// 	return new Promise(async function (resolve, reject) {
// 		try{
			
// 			    console.log("Successfully connected to the mongodb")
			    
// 			    db.collection("facts").insertOne(userData, function(err, res) {
// 			        if (err) throw err
// 			        console.log("Document inserted")
			       
			        
// 			    })
			    
			    
// 			    return resolve(true)
			   
// 		}catch(e){
//       console.log(e)
//       return resolve(false)
//     }
			
// 	})
// }

//upload facts
// static refreshById(mysql, refresh_id,type){
// 	main(mysql,refresh_id,type)


//     async function main(mysql, refresh_id,type){
// 	  try{
// 	    await facts(mysql,refresh_id,type)
// 	    //mysql.close()
// 	    }catch(e){
// 	    console.log(e)
// 	  }
// 	}
// 	//create facts
//     async function facts(mysql, refresh_id,type){

// 	  const browser = await puppeteer.launch()
// 	  const page = await browser.newPage()
	   
// 	   await page.setViewport({
// 	        width: 500,
// 	        height: 700,
// 	        deviceScaleFactor: 1.5,
// 	    })
	 
// 	   	if(type == 'app'){
	   	
// 	   		 let description=await getDescriptionById(mysql,refresh_id) 
			   	
// 			    let fact_descrip = description[0].description
// 			      let fact_id,imageArray =[],sample,image_name, screenshot_image,image_url
// 			      fact_id =description[0].id
// 			      for(let j =1;j<3;j++){
// 			        let img_link = 'https://doubtnut-static.s3.ap-south-1.amazonaws.com/faraday/templates/'+[j]+'.jpg'
// 			        //let img_link = 'https://d10lpgp6xz60nq.cloudfront.net/faraday/templates/'+[j]+'.jpg'
// 			        let template= await readFileAsync('./src/fact-template-test.html','utf8')
// 			        template =  template.replace('$',img_link)
// 			        template =  template.replace('#', fact_descrip)
			        
// 			        await page.setContent(template)
// 			        image_name = 'fact'+'_'+fact_id+'_'+Date.now()+'.png';
// 			        screenshot_image = await page.screenshot({path:  './images/'+ image_name ,type:"png"})
// 			        // image_url = 'https://doubtnut-static.s3.ap-south-1.amazonaws.com/faraday/facts/'+image_name
// 			        image_url = 'https://d10lpgp6xz60nq.cloudfront.net/faraday/facts/'+image_name
// 			        sample ={}
// 			        sample.image =image_url
// 			        sample.file_name =image_name
// 			        sample.file_content =screenshot_image
// 			        imageArray.push(sample)
			          
// 			      }
			      
// 			    await updateSpecificImageToMysql(imageArray,mysql, refresh_id)
			      

// 			    await readdirSpecificAsync('./images/',imageArray,mysql)
// 	   	}
// 	   	if(type == 'whatsapp'){
	   		
// 	   		let description=await getDescriptionById(mysql,refresh_id) 
			   	
// 			    let fact_descrip = description[0].description
// 			      let fact_id,imageArray =[],sample,image_name, screenshot_image,image_url
// 			      fact_id =description[0].id
// 			      for(let j =1;j<3;j++){
// 			        let img_link = 'https://doubtnut-static.s3.ap-south-1.amazonaws.com/faraday/templates/'+[j]+'.jpg'
// 			        //let img_link = 'https://d10lpgp6xz60nq.cloudfront.net/faraday/templates/'+[j]+'.jpg'
// 			        let template= await readFileAsync('./src/fact-template-test.html','utf8')
// 			        template =  template.replace('$',img_link)
// 			        template =  template.replace('#', fact_descrip)
// 			        console.log(template);
// 			        await page.setContent(template)
// 			        image_name = 'fact'+'_'+fact_id+'_'+Date.now()+'.png';
// 			        screenshot_image = await page.screenshot({path:  './images/'+ image_name ,type:"png"})
// 			        // image_url = 'https://doubtnut-static.s3.ap-south-1.amazonaws.com/faraday/facts/'+image_name
// 			        image_url = 'https://d10lpgp6xz60nq.cloudfront.net/faraday/facts/'+image_name
// 			        sample ={}
// 			        sample.image =image_url
// 			        sample.file_name =image_name
// 			        sample.file_content =screenshot_image
// 			        imageArray.push(sample)
			          
// 			      }
			      
// 			    await updateWhatsappImageToMysql(imageArray,mysql, refresh_id)
			      

// 			    await readdirSpecificAsync('./images/',imageArray,mysql)
// 	   	}
		   	
	   

// 	   await browser.close()
	   
// 	}
	// read facts
	// async function readdirSpecificAsync(image_path,imageArray,mysql) {
		
    //  	for(let i=0;i<2;i++){
    //  		let upload =fs.readFileSync("./images/"+imageArray[i].file_name)
    //   		uploadSpecificImageToS3(s3, upload, imageArray[i].file_name)
    //  	}
     
	// }

	// function getDescriptionById(mysql,refresh_id){
	//   let sql ="SELECT * FROM fact_repo where id ='"+refresh_id+"'"
	//   return mysql.query(sql)
	// }
	// // upload facts to s3
	// function uploadSpecificImageToS3(s3,  upload, file) {

	//   s3.putObject({
	//       Bucket: 'doubtnut-static',
	//       Key: "faraday/facts/"+file,
	//       Body: upload,
	//       ContentType : 'image/jpeg',
	//       ACL:'public-read'
	//   },function (err,resp) {
	//       if (err) {
	//           console.log(err)
	         
	//       } else {

	//           console.log("Successfully uploaded images to faraday/facts")
	         
	//       }  
	//   })


	// }


//    function updateSpecificImageToMysql(imageArray,mysql,refresh_id){
    
    
//      let sql = "UPDATE fact_repo SET image_type_1 ='"+imageArray[0]['image']+"',image_type_2 ='"+imageArray[1]['image']+"'  WHERE id ='"+refresh_id+"'"
//      return mysql.query(sql) 
    
//     }

//     function updateWhatsappImageToMysql(imageArray,mysql,refresh_id){
    
    
//      let sql = "UPDATE fact_repo SET whatsapp_image_1 ='"+imageArray[0]['image']+"',whatsapp_image_2 ='"+imageArray[1]['image']+"' WHERE id ='"+refresh_id+"'"
//      return mysql.query(sql) 
    
//     }

// }

// static refresh(mysql,type){
// 	main(mysql,type)

// 	async function main(mysql, type){
// 	  try{
// 	    await facts(mysql,type)
// 	    //mysql.close()
// 	    }catch(e){
// 	    console.log(e)
// 	  }
// 	}
// 	//create facts
	
//     async function facts(mysql,type){

// 	  const browser = await puppeteer.launch()
// 	  const page = await browser.newPage()
	   
// 	   await page.setViewport({
// 	        width: 500,
// 	        height: 700,
// 	        deviceScaleFactor: 1.5,
// 	    })
	  	
	
//    		if(type == 'app'){
   			
// 	   		let description=await getDescription(mysql) 
		   
// 		    for(let i=0;i<description.length;i++){
// 		      let fact_id, imageArray =[],sample,image_name,image_url
// 		      fact_id = description[i].id
// 		      for(let j =1;j<3;j++){
// 		      	let img_link = 'https://doubtnut-static.s3.ap-south-1.amazonaws.com/faraday/templates/'+[j]+'.jpg'
// 		        //let img_link = 'https://d10lpgp6xz60nq.cloudfront.net/faraday/templates/'+[j]+'.jpg'
// 		        let template= await readFileAsync('./src/fact-template-test.html','utf8')
// 		        template =  template.replace('$',img_link)
// 		        template =  template.replace('#', description[i].description)
		  
// 		        await page.setContent(template)
// 		        image_name = 'fact'+'_'+fact_id+'_'+Date.now()+'.png';
// 		        await page.screenshot({path:  './images/'+ image_name ,type:"png"})
// 		        image_url = 'https://d10lpgp6xz60nq.cloudfront.net/faraday/facts/'+image_name
// 		        sample ={}
// 		        sample.image =image_url
// 		        imageArray.push(sample)
		          
// 		      }
		     
// 		        await updateImageToMysql(imageArray,mysql, fact_id)
// 		    }  
		    
// 		    await readdirAsync('./images/',mysql)
// 			}
// 			if(type == 'whatsapp'){
				
// 				let description=await getDescription(mysql) 
			   
// 			    for(let i=0;i<description.length;i++){
// 			      let fact_id, imageArray =[],sample,image_name,image_url
// 			      fact_id = description[i].id
// 			      for(let j =1;j<3;j++){
// 			      	let img_link = 'https://doubtnut-static.s3.ap-south-1.amazonaws.com/faraday/templates/'+[j]+'.jpg'
// 			        //let img_link = 'https://d10lpgp6xz60nq.cloudfront.net/faraday/templates/'+[j]+'.jpg'
// 			        let template= await readFileAsync('./src/fact-template-test.html','utf8')
// 			        template =  template.replace('$',img_link)
// 			        template =  template.replace('#', description[i].description)
			        
// 			        await page.setContent(template)
// 			        image_name = 'fact'+'_'+fact_id+'_'+Date.now()+'.png';
// 			        await page.screenshot({path:  './images/'+ image_name ,type:"png"})
// 			        image_url = 'https://d10lpgp6xz60nq.cloudfront.net/faraday/facts/'+image_name
// 			        sample ={}
// 			        sample.image =image_url
// 			        imageArray.push(sample)
			          
// 			      }
			     
// 			        await updateWhatsappImageToMysql(imageArray,mysql, fact_id)
// 			    }  
			    
// 			    await readdirAsync('./images/',mysql)

// 			}
		    
	   

// 	   await browser.close()
	   
// 	}
	


//     function updateWhatsappImageToMysql(imageArray,mysql,refresh_id){
    
    
//      let sql = "UPDATE fact_repo SET whatsapp_image_1 ='"+imageArray[0]['image']+"',whatsapp_image_2 ='"+imageArray[1]['image']+"' WHERE id ='"+refresh_id+"'"
//      return mysql.query(sql) 
    
//     }



//     // read facts 
// 	async function readdirAsync(image_path,mysql) {
		
//     fs.readdirSync(image_path).forEach(file => {

//         let upload = fs.readFileSync("./images/"+file)

//         uploadImageToS3(s3, upload, file)
//          })
     
// 	}

// 	async function getDescription(mysql){
// 	  let sql ="SELECT * FROM fact_repo"
// 	  return mysql.query(sql)
// 	}
// 	//upload facts to s3
// 	function uploadImageToS3(s3,  upload, file) {

// 	  s3.putObject({
// 	      Bucket: 'doubtnut-static',
// 	      Key: "faraday/facts/"+file,
// 	      Body: upload,
// 	      ContentType : 'image/jpeg',
// 	      ACL:'public-read'
// 	  },function (err,resp) {
// 	      if (err) {
// 	          console.log(err)
	         
// 	      } else {

// 	          console.log("Successfully uploaded images to faraday/facts")
	         
// 	      }  
// 	  })


// 	}


//    async function updateImageToMysql(imageArray,mysql,fact_id){

//      let sql = "UPDATE fact_repo SET image_type_1 ='"+imageArray[0]['image']+"',image_type_2 ='"+imageArray[1]['image']+"' WHERE id ='"+fact_id+"'"
//      return mysql.query(sql) 
    
//     }
// }

// }