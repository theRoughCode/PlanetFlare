"use strict";
const pipe = require("it-pipe");
const { PAYMENT_STRATEGIES } = require("../strategies/payment-strategy");
const { log, error } = require("../logger");

class PaymentProtocol {
  // Define the codec of our payment protocol
  PROTOCOL = "/planetflare/payment/1.0.0";

  /**
   * Initializes the PaymentProtocol class with a given `paymentStrategy`.
   * @param {Function} paymentStrategy Strategy that takes in { token, peerId } and
   *                                   handles the management of tokens.
   */
  constructor(paymentStrategy = "DEFAULT") {
    this.setPaymentStrategy(paymentStrategy);
  }

  setPaymentStrategy = (paymentStrategy) => {
    if (!PAYMENT_STRATEGIES.hasOwnProperty(paymentStrategy)) {
      error(`Invalid payment strategy: ${paymentStrategy}`);
      return;
    }
    log(`Setting payment strategy to ${paymentStrategy}.`);
    this.paymentStrategy = PAYMENT_STRATEGIES[paymentStrategy];
  }

  /**
   * A simple handler to print incoming messages to the console
   * @param {Object} params
   * @param {Connection} params.connection The connection the stream belongs to
   * @param {Stream} params.stream A pull-stream based stream to the peer
   */
  handler = async ({ connection, stream }) => {
    const that = this;
    try {
      await pipe(stream, async function (source) {
        for await (const message of source) {
          const token = String(message);
          log(`Received token ${token} from ${connection.remotePeer.toB58String()}!`);
          const peerId = connection.remotePeer.toB58String();
          that.paymentStrategy({ token, peerId }).catch((err) =>
            error(err.message)
          );
        }
      });

      // Close this stream so we don't leak it
      await pipe([], stream);
    } catch (err) {
      error(err.message);
    }
  };
}

module.exports = PaymentProtocol;
