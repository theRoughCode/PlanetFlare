"use strict";
const pipe = require("it-pipe");
const lp = require("it-length-prefixed");
const KadDHT = require("libp2p-kad-dht");
const { Message } = require("./dht.proto");
const { DEFAULT_CACHE_STRATEGY } = require("../strategies/cache-strategy");

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
      await pipe(stream, lp.decode(), async (source) => {
        for await (const message of source) {
          // .slice converts from BufferList to Buffer
          const msg = Message.decode(message.slice());
          this.cacheStrategy(this.cdnManager, msg, peerId).catch((err) =>
            console.error(err)
          );
        }
      });
    } catch (err) {
      console.error(err);
    }
  };
}

module.exports = CacheProtocol;
