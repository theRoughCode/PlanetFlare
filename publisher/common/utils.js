const abi = require('ethereumjs-abi');
const bigInt = require('big-integer');

function convertUUIDToDecimal(guid) {
   let guidBytes = `0${guid.replace(/-/g, "")}`; //add prefix 0 and remove `-`
   let bigInteger = bigInt(guidBytes,16);

   return bigInteger.toString();
}

function bucketIDToBountyID(web3, address, bucketID) {
   const result = abi.soliditySHA3(
      ['address', 'string'],
      [address, bucketID]
   );

   return (new web3.utils.BN(result)).toString();
}

module.exports = { convertUUIDToDecimal, bucketIDToBountyID };
