const abi = require('ethereumjs-abi');
const uuid = require('uuid');

class PaymentManager {
    constructor(web3, unlockedAccount) {
        this.web3 = web3;
        this.account = unlockedAccount;
    }

    createFuturePayment(recipientAddress, bountyID, numTokens) {
        const futurePaymentData = {
            recipeint: recipientAddress,
            bountyID: bountyID,
            numTokens: numTokens,
            nonce: uuid.v4()
        };

        const signature = createSignature(futurePaymentData);

        return {
            data: futurePaymentData,
            signature: signature
        }
    }


    incrementFuturePayment(futurePayment, additionalNumTokens) {
        let futurePaymentData = futurePayment.data;
        futurePaymentData.numTokens += additionalNumTokens;

        const signature = createSignature(futurePaymentData);

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
        );
    }
}

module.exports = PaymentManager;
