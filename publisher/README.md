## API methods:

### GET `get_tokens`
Arguments:
* Query string, `num`

Returns JSON. Keys:
* `tokens`: array containing tokens

### POST `verify_payment`
Arguments, JSON:
* `tokens` (required): array of tokens from `get_tokens`
*  one of`bountyID` or `bucketID` (required): used to identify which bounty the token is for
* `recipientAddress` (required): address of provider
* `futurePayment` (optional): see return value for more info

Returns `futurePayment` as JSON, with the following keys:
* `data`: JSON object containing `bountyID`, `recipient`, `numTokens` and `nonce`
* `signature`: cryptographic proof of the `data`, which can be verified

If a `futurePayment` was provided as an argument to the function call, the `numTokens` field of `futurePayment.data` is incremented. Otherwise, a new `futurePayment` is created.

Note: The signature *must* be attached to the call if using an existing `futurePayment`

##### Verifying that the signature received from the publisher is valid

```js
const abi = require('ethereumjs-abi');

function generateSignatureHash(futurePaymentData) {
    const recipientAddress = futurePaymentData.recipeint;
    const bountyID = futurePaymentData.bountyID;
    const numTokens = futurePaymentData.numTokens;
    const nonce = futurePaymentData.nonce;

    return '0x' + abi.soliditySHA3(
        ['address', 'uint256', 'uint256', 'uint256'],
        [recipientAddress, bountyID, numTokens, nonce]
    )
}

function verifyFuturePayment(publisherAddress, futurePayment) {
    const signatureHash = generateSignatureHash(futurePayment.data);
    const signer = web3.eth.accounts.recover(signatureHash, futurePayment.signature);

    return signer == publisherAddress;
}
```
