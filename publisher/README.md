## API methods:

### GET `get_tokens`
Arguments:
* Query string, `num`

Returns JSON. Keys:
* `tokens`: array containing tokens

### POST `verify_payment`
Arguments, JSON:
* `tokens` (required): array of tokens from `get_tokens`
* `bountyID` (required): which bounty the token is for
* `recipientAddress` (required): address of provider
* `futurePayment` (optional): see return value for more info

Returns `futurePayment` as JSON, with the following keys:
* `data`: JSON object containing `bountyID`, `recipientAddress`, `numTokens` and `nonce`
* `signature`: cryptographic proof of the `data`, which can be verified

If a `futurePayment` was provided as an argument to the function call, the `numTokens` field of `futurePayment.data` is incremented. Otherwise, a new `futurePayment` is created.

Note: The signature *must* be attached to the call if using an existing `futurePayment`
