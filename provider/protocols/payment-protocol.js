"use strict";
const pipe = require("it-pipe");
const protons = require("protons");

// Define Protobuf schema
const { Payment } = protons(`
message Payment {
  required bytes token = 1;
}
`);

class PaymentProtocol {
  
  // Define the codec of our payment protocol
  PROTOCOL = "/planetflare/payment/1.0.0";

  constructor(cdnManager) {
    this.cdnManager = cdnManager;
  }

  /**
   * A simple handler to print incoming messages to the console
   * @param {Object} params
   * @param {Connection} params.connection The connection the stream belongs to
   * @param {Stream} params.stream A pull-stream based stream to the peer
   */
  handler = async ({ connection, stream }) => {
    try {
      await pipe(stream, async function (source) {
        for await (const message of source) {
          const { token } = Payment.decode(message);
          const remotePeerId = connection.remotePeer.toB58String();
          // Do something with token
        }
      });

      // Replies are done on new streams, so let's close this stream so we don't leak it
      await pipe([], stream);
    } catch (err) {
      console.error(err);
    }
  };
}

module.exports = PaymentProtocol;
