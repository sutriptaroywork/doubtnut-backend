"use strict";
// require('dotenv').config();
// const database = require('../../api_server/config/database');
var Utility = require('../../api_server/modules/utility');
const _ = require('lodash')
const fs = require("fs")
const Json2csvParser = require("json2csv").Parser
const doubtnutFields = [
  "Category",
  "Keyword",
  "Title",
  "Link",
  "Youtube_Id"]
const doubtnutParser = new Json2csvParser({ doubtnutFields })

var http = require('https')
var cheerio = require('cheerio')


async function main (){
	try{
		await crawl()
	}catch(e){
		console.log(e)
	}
}

async function crawl(){
	//console.log("in")
	try{
		let i,data =[]
		let keyword =["Doubtnut","Physics in Hindi", "Chemistry in Hindi", "Learn English in Hindi", "Sandeep Maheshwari","Pranks in India", "Funny Dance India","India Funny Videos","Thug life videos animals","Funny Indian Kids","Most viral videos India","Magician videos India","Extreme Sports videos", "Fear Factor Hindi videos","Political News", "India News", "Sports News", "Latest News","IPL best videos","Bollywood songs", "New Hindi movie trailers","Old Hindi songs", "Best funny Hindi movie scenes"]
		//console.log(keyword.length)
		var cat = {
		  "Education": ["Doubtnut","Physics in Hindi", "Chemistry in Hindi", "Learn English in Hindi", "Sandeep Maheshwari"],
		  "Funny": ["Pranks in India", "Funny Dance India","India Funny Videos","Thug life videos animals","Funny Indian Kids"],
		  "Popular": ["Most viral videos India","Magician videos India","Extreme Sports videos", "Fear Factor Hindi videos","Political News", "India News", "Sports News", "Latest News"],
		  "Entertainment":["IPL best videos","Bollywood songs", "New Hindi movie trailers","Old Hindi songs", "Best funny Hindi movie scenes"]
		};
		// var keys = Object.keys(cat)
		// var values = Object.values(cat)

		for(let j=0;j<keyword.length;j++){
			//console.log(keyword[j])


				let crawlresult = await Utility.getCrawlData(keyword[j])	
				//console.dir(crawlresult)
				
				if(crawlresult.length>0){
					//console.log(crawlresult.length)
					for(i=0;i<crawlresult.length;i++){
						for (const [k, v] of Object.entries(cat)) {
				  		//console.log(`Here is key ${k} and here is value ${v}`)
				  		if(v.includes(keyword[j])){
				  			//console.log(k)
				  			var category = k
				  		}
						}
						//console.log(category)
						let sample={}
						 sample.category =category
		               	 sample.keyword =keyword[j]
		                 sample.title =crawlresult[i]['title']
		                 sample.link =crawlresult[i]['link']
		                 sample.youtube_id = crawlresult[i]['link'].split("v=")[1].substring(0, 11)
		                 data.push(sample)
					}
				}
		}	
		//console.log(data)
		return data	
	}catch(e){
		console.log(e)
		
	}
	
}

crawl().then((value) => {
  const csv = doubtnutParser.parse(value);
  let doubtnutCsvName = "Youtube Based Keywords Search" + ".csv"
  fs.writeFile(doubtnutCsvName, csv, 'utf8', function (err) {
    if (err) {
      console.log('Some error occured - file either not saved or corrupted file saved.')
    } else {
      console.log('keyword based search csv saved!')
    }
  })
    //console.log(value) 
})	