"use strict";
const pipe = require("it-pipe");
const KadDHT = require("libp2p-kad-dht");
const { Message } = require('./dht.proto');
const { DEFAULT_CACHE_STRATEGY } = require('../strategies/cache-strategy');

class CacheProtocol {
  // Listen in on KAD DHT protocol
  PROTOCOL = KadDHT.multicodec;

  constructor(cdnManager, cacheStrategy = DEFAULT_CACHE_STRATEGY) {
    this.cdnManager = cdnManager;
    this.cacheStrategy = cacheStrategy;
  }

  /**
   * A simple handler to print incoming messages to the console
   * @param {Object} params
   * @param {Connection} params.connection The connection the stream belongs to
   * @param {Stream} params.stream A pull-stream based stream to the peer
   */
  handler = async ({ connection, stream }) => {
    const peerId = connection.remotePeer;
    try {
      await pipe(stream, async function (source) {
        for await (const message of source) {
          const msg = Message.decode(message);
          this.cacheStrategy(cdnManager, msg, peerId)
            .catch(err => console.error(err));
        }
      });

      // Replies are done on new streams, so let's close this stream so we don't leak it
      await pipe([], stream);
    } catch (err) {
      console.error(err);
    }
  };
}

module.exports = CacheProtocol;
