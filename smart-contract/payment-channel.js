var abi = require('ethereumjs-abi');

function generateSignatureHash(recipient, bountyID, amount, nonce) {
    return "0x" + abi.soliditySHA3(
        ["address", "uint256", "uint256", "uint256"],
        [recipient, bountyID, amount, nonce]
    ).toString("hex");
}

function generateSignatureHashNew(futurePaymentData) {
    const recipientAddress = futurePaymentData.recipient;
    const bountyID = futurePaymentData.bountyID;
    const numTokens = futurePaymentData.numTokens;
    const nonce = futurePaymentData.nonce;

    // console.log(futurePaymentData);

    console.log(recipientAddress, bountyID, numTokens, nonce);

    // return generateSignatureHash(recipientAddress, bountyID, numTokens, nonce);

    return generateSignatureHash(
        futurePaymentData.recipient,
        futurePaymentData.bountyID,
        futurePaymentData.numTokens,
        futurePaymentData.nonce
    );

    // return "0x" + abi.soliditySHA3(
    //     ["address", "uint256", "uint256", "uint256"],
    //     [
    //         futurePaymentData.recipeint, 
    //         futurePaymentData.bountyID, 
    //         futurePaymentData.numTokens, 
    //         futurePaymentData.nonce
    //     ]
    // ).toString("hex");
}

module.exports = {
    generateSignatureHash,
    generateSignatureHashNew
};
