const abi = require('ethereumjs-abi');
const uuid = require('uuid');
const uuidToDecimal = require('./common/utils').convertUUIDToDecimal;

class PaymentManager {
    constructor(web3, unlockedAccount) {
        this.web3 = web3;
        this.account = unlockedAccount;
    }

    createFuturePayment(recipientAddress, bountyID) {
        const futurePaymentData = {
            recipeint: recipientAddress,
            bountyID: bountyID,
            numTokens: 0,
            nonce: uuidToDecimal(uuid.v4())
        };

        const signature = this.createSignature(futurePaymentData);

        return {
            data: futurePaymentData,
            signature: signature
        }
    }


    incrementFuturePayment(futurePayment, additionalNumTokens) {
        let futurePaymentData = futurePayment.data;
        futurePaymentData.numTokens += additionalNumTokens;

        const signature = this.createSignature(futurePaymentData);

        return {
            data: futurePaymentData,
            signature: signature
        }
    }


    createSignature(futurePaymentData) {
        const recipientAddress = futurePaymentData.recipeint;
        const bountyID = futurePaymentData.bountyID;
        const numTokens = futurePaymentData.numTokens;
        const nonce = futurePaymentData.nonce;

        const signatureHash  = '0x' + abi.soliditySHA3(
            ['address', 'uint256', 'uint256', 'uint256'],
            [recipientAddress, bountyID, numTokens, nonce]
        )

        return this.web3.eth.accounts.sign(
            signatureHash, this.account.privateKey
        ).signature;
    }

    verifyFuturePayment(futurePayment) {
        let signature = this.createSignature(futurePayment.data);
        return signature == futurePayment.signature;
    }
}

module.exports = PaymentManager;
