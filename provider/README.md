# PlanetFlare Provider

### Start running your PlanetFlare Provider IPFS node
1. Run `npm install`.
2. Run `node index.js`.
3. Voila, your node is up and participating in the PlanetFlare ecosystem!

## Protocols
### 1. Retrieval Protocol
**Protocol**: "/planetflare/retrieve/1.0.0"

**Purpose**: The client wants to retrieve a file from the provider.

**Steps**:
1. Client sends a `Request` to the provider with the CID of the file they want. They will also include a signed version of the CID and a PlanetFlare ID, proving to the provider that they are an authenticated client. The provider can verify that the client is authenticated by ensuring that `pfId` is a valid PlanetFlare ID by querying the chain and using that to verify the `signedCId`. Note that the provider can choose _not_ to verify (and to trust the client) in exchange for a higher chance at claiming the reward (lower latency).
```protobuf
message Request {
  required bytes cId = 1;
  required bytes signedCId = 2;
  required bytes pfId = 3;
}
```
2. Provider receives the `Request` and sends back a `Response` if and only if they have that file on hand.
```protobuf
message Response {
  required bytes cId = 1;
  required bytes data = 2;
}
```
### 2. Payment Protocol
**Protocol**: "/planetflare/payment/1.0.0"

**Purpose**: The client sends the payment token to the provider as a reward for serving files.

**Steps**:
1. Client sends a `Payment` to the provider containing the `token`.
```protobuf
message Payment {
  required bytes token = 1;
}
```
2. Provider saves it for future redemption.
