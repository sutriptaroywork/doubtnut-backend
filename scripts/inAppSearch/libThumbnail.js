require('dotenv').config({ path: __dirname + '/../../api_server/.env' });
const config = require(__dirname + '/../../api_server/config/config');
const database = require('../../api_server/config/database');
const neatCsv = require('neat-csv');
const fs = require('fs');
const puppeteer = require('puppeteer')
const { promisify } = require('util')
const readFileAsync = promisify(fs.readFile)
const webp=require('webp-converter');
// // connection to mysql
const mysql = new database(config.mysql_analytics);
const writeMysql = new database(config.write_mysql);

function checkIdExistInappSearch(id) {
    let sql = `SELECT * from inapp_search_data where id=${id}`;
    return mysql.query(sql)
  }

async function main(){
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    fs.readFile('./thumbnailSheet.csv', async (err, data) => {
        if (err) {
          console.error(err)
          return
        }
        let temp = await neatCsv(data);
        let j =1;
        console.log(temp.length)
        for (let i = 0; i < temp.length; i++) {
            console.log(temp[i]['ID']);
            console.log(i+1)
            if(temp[i]['ID']!=='#N/A'){
                let libData = await checkIdExistInappSearch(temp[i]['ID']);
                let template = await readFileAsync('./playlist.html', "utf8");
                if(temp[i]['H2']==='Topic Videos'){
                    template = await readFileAsync('./topic.html', "utf8");
                }
                if(!temp[i]['H3'] && !temp[i]['H4'] && libData[0]['class']!='14' && libData[0]['class']!='13'){
                    temp[i]['H3'] = 'Class '+libData[0]['class'];
                }
                if(libData[0].items_count && !libData[0].thumbnail_imag_url && libData[0].is_active && libData[0].resource_type==='playlist'){
                    temp[i]['H1'] = temp[i]['H1'].toUpperCase();
                    template = template.replace('##t1##', temp[i]['H1']);
                    template = template.replace('##t2##', temp[i]['H2']);
                    template = template.replace('##t3##', temp[i]['H3']);
                    template = template.replace('##t4##', temp[i]['H4']);
                    template = template.replace('##t4##', temp[i]['H4']);
                    template = template.replace('##t5##', libData[0]['items_count']);
                    await page.setContent(template)
                    await page.setViewport({
                        width : 300,
                        height: 211,
                    });
                    await page.screenshot({path: `/Users/sudhir/Desktop/thumbnail/library_${temp[i]['ID']}.png` ,type:"png","alt":'image'});
                    webp.cwebp(`/Users/sudhir/Desktop/thumbnail/library_${temp[i]['ID']}.png`, `/Users/sudhir/Desktop/thumbnail1/library_${temp[i]['ID']}.webp`, "-q 80", function(status,error) {
                        console.log(status,error);
                    });
                    console.log("images no :", j++);
                    const img_url = 'https://d10lpgp6xz60nq.cloudfront.net/inapp_search/library_'+temp[i]['ID']+'.webp';
                    console.log(img_url)
                    const str = `UPDATE inapp_search_data SET thumbnail_img_url='${img_url}' where id=${temp[i]['ID']}`;
                    await writeMysql.query(str);
                }
            }
        }
        console.log("completed successfully 1");
      })
}

main();