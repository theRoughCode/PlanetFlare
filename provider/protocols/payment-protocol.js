"use strict";
const pipe = require("it-pipe");
const protons = require("protons");
const { DEFAULT_PAYMENT_STRATEGY } = require("../strategies/payment-strategy");

// Define Protobuf schema
const { Payment } = protons(`
message Payment {
  required string token = 1;
}
`);

class PaymentProtocol {
  // Define the codec of our payment protocol
  PROTOCOL = "/planetflare/payment/1.0.0";

  /**
   * Initializes the PaymentProtocol class with a given `paymentStrategy`.
   * @param {Function} paymentStrategy Strategy that takes in { token, peerId } and
   *                                   handles the management of tokens.
   */
  constructor(paymentStrategy = DEFAULT_PAYMENT_STRATEGY) {
    this.paymentStrategy = paymentStrategy;
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
          const peerId = connection.remotePeer.toB58String();
          this.paymentStrategy({ token, peerId }).catch((err) =>
            console.error(err)
          );
        }
      });

      // Close this stream so we don't leak it
      await pipe([], stream);
    } catch (err) {
      console.error(err);
    }
  };
}

module.exports = PaymentProtocol;
