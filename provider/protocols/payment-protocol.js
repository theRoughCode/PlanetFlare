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
  constructor(io, paymentStrategy = "DEFAULT") {
    this.io = io;
    this.setPaymentStrategy(paymentStrategy);
    this.tokens = {
      QmP9NGmnL1VK36n33MYVkucF2PaqA5KNYFbyBsFsnBMxXh: [ '9676d7b7-1798-41cc-8c97-3ddec0494519',
      '3d6ef2c4-f16a-433b-ab86-531ce7c0d34b' ]
    };
  }

  setPaymentStrategy = (paymentStrategy) => {
    if (!PAYMENT_STRATEGIES.hasOwnProperty(paymentStrategy)) {
      error(`Invalid payment strategy: ${paymentStrategy}`);
      return;
    }
    log(`Setting payment strategy to ${paymentStrategy}.`);
    this.paymentStrategy = PAYMENT_STRATEGIES[paymentStrategy];
  };

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
          const { token, cid } = JSON.parse(String(message));
          if (!that.tokens.hasOwnProperty(cid)) that.tokens[cid] = [];
          that.tokens[cid].push(token);

          log(
            `Received token ${token} from ${connection.remotePeer.toB58String()}!`
          );

          const peerId = connection.remotePeer.toB58String();
          that
            .paymentStrategy({ token, cid, peerId })
            .catch((err) => error(err.message));
        }
      });

      // Close this stream so we don't leak it
      await pipe([], stream);

      // Notify UI
      this.io.emit("tokens", this.tokens);
    } catch (err) {
      error(err.message);
    }
  };
}

module.exports = PaymentProtocol;
