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
1. Client sends a `Request` to the provider with the CID of the file they want.
```protobuf
message Request {
  required bytes cId = 1;
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
  required string token = 1;
}
```
2. Provider saves it for future redemption.
