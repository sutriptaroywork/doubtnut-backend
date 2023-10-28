const mathsteps = require('mathsteps');
var msg = "2x+8x=9"
var ques1 = msg
var html = ""
console.log("msg",msg)

function checkForDivision(str){
    if(str.includes("="))
      return str
    let strArray = str.split("/")
    console.log(strArray.length)
    if(strArray.length == 1){
      return str
    }else{
      let result = parseFloat(strArray[0])/ parseFloat(strArray[1])
      if(isNaN(result)){
        return str
      }else{
        return result
      }
    }
}

if(/^\d+$/.test(msg) || /^\d+\.\d+$/.test(msg)){
  console.log("this is just some digits")
  html = "This is not a question. Just some digits"
}else{
  if(msg.includes("?")  || msg.includes("=")){
    ques1 = ques1.replace(/\?/g, '')
    ques1 = ques1.replace(/=/g, '')
  }
  const steps = mathsteps.simplifyExpression(ques1);
  steps.forEach(step => {
    // console.log(step)
    console.log("before change: " + step.oldNode.toString());   // before change: 2 x + 2 x + x + x
    console.log("change: " + step.changeType);                  // change: ADD_POLYNOMIAL_TERMS
    console.log("after change: " + step.newNode.toString());    // after change: 6 x
    console.log("# of substeps: " + step.substeps.length);      // # of substeps: 3
    html = step.newNode.toString()
  });

  const steps1 = mathsteps.solveEquation(msg);

  steps1.forEach(step => {
      // console.log("hi")
      // console.log(step)
      console.log("before change: " + step.oldEquation.ascii());  // e.g. before change: 2x + 3x = 35
      console.log("change: " + step.changeType);                  // e.g. change: SIMPLIFY_LEFT_SIDE
      console.log("after change: " + step.newEquation.ascii());   // e.g. after change: 5x = 35
      console.log("# of substeps: " + step.substeps.length);      // e.g. # of substeps: 2
      // html = html + step.newEquation.ascii() + '\n'
      html = step.newEquation.ascii()
  });
  // console.log(html)
  if(html == '')
    html = msg
  console.log(checkForDivision(html))

  // console.log("html"+html)
}