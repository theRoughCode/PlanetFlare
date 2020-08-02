const bigInt = require('big-integer');

function convertUUIDToDecimal(guid) {
   let guidBytes = `0${guid.replace(/-/g, "")}`; //add prefix 0 and remove `-`
   let bigInteger = bigInt(guidBytes,16);

   return bigInteger.toString();
}


module.exports = { convertUUIDToDecimal };
