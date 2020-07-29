"use strict";
const pipe = require("it-pipe");
const lp = require("it-length-prefixed");
const KadDHT = require("libp2p-kad-dht");
const { DHTMessage } = require("./dht.proto");
const { BitswapMessage } = require("./bitswap.proto");
const { DEFAULT_CACHE_STRATEGY } = require("../strategies/cache-strategy");

const BITSWAP100 = "/ipfs/bitswap/1.0.0";
const BITSWAP110 = "/ipfs/bitswap/1.1.0";
const BITSWAP120 = "/ipfs/bitswap/1.2.0";

const protocols = [
  // Listen in on bitswap protocol
  BITSWAP120,
  BITSWAP110,
  BITSWAP100,
  // Listen in on KAD DHT protocol
  KadDHT.multicodec,
];

class CacheProtocol {
  PROTOCOLS = protocols;

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
  handler = async ({ protocol, connection, stream }) => {
    const peerId = connection.remotePeer;

    try {
      await pipe(stream, lp.decode(), async (source) => {
        let message = null;
        for await (const data of source) {
          try {
            switch (protocol) {
              case BITSWAP120:
              case BITSWAP110:
              case BITSWAP100:
                message = BitswapMessage.decode(data.slice());
                break;

              case KadDHT.multicodec:
                message = DHTMessage.decode(data.slice());
                break;

              default:
                break;
            }

            console.log(`incoming new connection over ${protocol} protocol.`);
            this.cacheStrategy(this.cdnManager, protocol, message, peerId).catch((err) =>
              console.error(err)
            );
          } catch (err) {
            this.bitswap._receiveError(err);
            break;
          }
        }
      });
    } catch (err) {
      console.error(err);
    }
  };
}

module.exports = CacheProtocol;
