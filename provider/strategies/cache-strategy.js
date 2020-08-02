const { CID } = require("ipfs");
const KadDHTProtocol = require("libp2p-kad-dht").multicodec;
const { multihashToCid } = require("../utils");
const { DHTMessage } = require("../protocols/dht.proto");
const { log, error } = require("../logger");

const DHT_MESSAGE_TYPE = DHTMessage.MessageType;

const DEFAULT_DHT_STRATEGY = async (cdnManager, message, protocol) => {
  switch (message.type) {
    case DHT_MESSAGE_TYPE.GET_VALUE:
    case DHT_MESSAGE_TYPE.ADD_PROVIDER:
      let cid;
      try {
        cid = multihashToCid(message.key);
      } catch (err) {
        throw errcode(
          new Error(`Invalid CID: ${err.message}`),
          "ERR_INVALID_CID"
        );
      }
      log(
        `incoming new connection over ${protocol} protocol. `,
        `Requested CID: ${cid}`
      );
      if (!cdnManager.hasFile(cid)) {
        // Can choose to get data and cache
        log(
          `incoming new connection over ${protocol} protocol. `,
          `Retrieving data with CID: ${cid}`
        );
        cdnManager.retrieveFileFromRemote(cid, (store = true));
      }
      break;
    case DHT_MESSAGE_TYPE.PUT_VALUE:
      log(`incoming new connection over ${protocol} protocol. `, "DHT PUT");
      break;
    case DHT_MESSAGE_TYPE.GET_PROVIDER:
      log(
        `incoming new connection over ${protocol} protocol. `,
        "DHT GET_PROVIDER"
      );
      break;
    case DHT_MESSAGE_TYPE.FIND_NODE:
      log(
        `incoming new connection over ${protocol} protocol. `,
        "DHT FIND_NODE"
      );
      break;
    case DHT_MESSAGE_TYPE.PING:
      log(`incoming new connection over ${protocol} protocol. `, "DHT PING");
      break;
    default:
      error("Invalid DHT Message type: ", message.type);
      break;
  }
};

const DEFAULT_BITSWAP_STRATEGY = async (cdnManager, message, protocol) => {
  const cids = message.wantlist.entries
    .filter((entry) => entry.wantType === 0)
    .map((entry) => multihashToCid(new CID(entry.block).multihash));
  log(
    `incoming new connection over ${protocol} protocol. `,
    "Bitswap CIDs: ",
    cids
  );
};

const DEFAULT_CACHE_STRATEGY = async (
  cdnManager,
  protocol,
  message,
  peerId
) => {
  switch (protocol) {
    case KadDHTProtocol:
      DEFAULT_DHT_STRATEGY(cdnManager, message, protocol);
      break;

    default:
      DEFAULT_BITSWAP_STRATEGY(cdnManager, message, protocol);
      break;
  }
};

const TEST_CACHE_STRATEGY = async (cdnManager, protocol, message, peerId) => {
  console.log("Test cache strategy", protocol, message, peerId);
};

const CACHE_STRATEGIES = {
  "DEFAULT": DEFAULT_CACHE_STRATEGY,
  "TEST": TEST_CACHE_STRATEGY,
};

module.exports = {
  DEFAULT_CACHE_STRATEGY,
  CACHE_STRATEGIES,
};
