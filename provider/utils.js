const CID = require("cids");

const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const bs58 = require("base-x")(BASE58);

const multihashToCid = (multihash) => bs58.encode(new CID(multihash).multihash);

module.exports = {
  multihashToCid,
};
