var abi = require('ethereumjs-abi');

function generateSignatureHash(recipient, bountyID, amount, nonce) {
    return "0x" + abi.soliditySHA3(
        ["address", "uint256", "uint256", "uint256"],
        [recipient, bountyID, amount, nonce]
    ).toString("hex");
}

module.exports = {
    generateSignatureHash: generateSignatureHash
};
