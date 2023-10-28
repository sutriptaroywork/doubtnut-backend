var request = require('request');

var myJSONObject = { 
  "branch_key": "key_live_kaFuWw8WvY7yn1d9yYiP8gokwqjV0Swt",
  "channel": "facebook",
  "feature": "onboarding",
  "campaign": "new product",
  "stage": "new user",
  "tags": ["one", "two", "three"],
  "data": {
    "$canonical_identifier": "content/123",
    "$og_title": "Title from Deep Link",
    "$og_description": "Description from Deep Link",
    "$og_image_url": "http://www.lorempixel.com/400/400/",
    "$desktop_url": "http://www.example.com",
    "custom_boolean": true,
    "custom_integer": 1243,
    "custom_string": "everything",
    "custom_array": [1,2,3,4,5,6],
    "custom_object": { "random": "dictionary" }
  } };
request({
    url: "https://api2.branch.io/v1/url",
    method: "POST",
    json: true,   // <--Very important!!!
    body: myJSONObject
}, function (error, response, body){
	if(error){
		console.log(error);
	}else{
    console.log(body);
}
});