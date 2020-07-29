# PlanetFlare Provider

### Start running your PlanetFlare Provider IPFS node
1. Run `npm install`.
2. Run `nodemon` or `npm run dev`.
3. Voila, your node is up and participating in the PlanetFlare ecosystem!
4. Go to http://localhost.com:3000 to view your provider dashboard.

#### Stopping IPFS node
If you stop and restart the IPFS node right away, you might run into a "lock already held" error. The program automatically checks for this and tries starting the IPFS node again. To make sure that this error doesn't happen, type in `close` into `stdin` to gracefully shut down the program.

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

### 2. Cache Protocol
**Protocol**: "/ipfs/kad/1.0.0"

**Purpose**: Listen in on incoming DHT messages and trigger cache strategy.

Currently, only listens for `GET_VALUE` messages.
