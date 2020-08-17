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
            recipient: recipientAddress,
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

    generateSignatureHash(futurePaymentData) {
        const recipientAddress = futurePaymentData.recipient;
        const bountyID = futurePaymentData.bountyID;
        const numTokens = futurePaymentData.numTokens;
        const nonce = futurePaymentData.nonce;

        return '0x' + abi.soliditySHA3(
            ['address', 'uint256', 'uint256', 'uint256'],
            [recipientAddress, bountyID, numTokens, nonce]
        ).toString('hex');
    }


    createSignature(futurePaymentData) {
        const signatureHash = this.generateSignatureHash(futurePaymentData);

        return this.web3.eth.accounts.sign(
            signatureHash, this.account.privateKey
        ).signature;
    }

    verifyFuturePayment(futurePayment) {
        const signingAddress = this.web3.eth.accounts.recover(
            this.generateSignatureHash(futurePayment.data), 
            futurePayment.signature
        );
        console.log(`signing address: ${signingAddress}`);
        console.log(`public key: ${this.account.address}`);
        return signingAddress == this.account.address;
    }
}

module.exports = PaymentManager;
