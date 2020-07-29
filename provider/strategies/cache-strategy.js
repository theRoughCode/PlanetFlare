const fs = require("fs").promises;
const KadDHTProtocol = require("libp2p-kad-dht").multicodec;
const { multihashToCid } = require("../utils");
const { DHTMessage } = require("../protocols/dht.proto");
const { CID } = require("ipfs");

const DHT_MESSAGE_TYPE = DHTMessage.MessageType;

const DEFAULT_DHT_STRATEGY = async (cdnManager, message) => {
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
      console.log(`Requested CID: ${cid}`);
      if (!cdnManager.hasFile(cid)) {
        // Can choose to get data and cache
        console.log(`Retrieving data with CID: ${cid}`);
        cdnManager.retrieveFileFromRemote(cid, (store = true));
      }
      break;
    case DHT_MESSAGE_TYPE.PUT_VALUE:
      console.log("DHT PUT");
      break;
    case DHT_MESSAGE_TYPE.GET_PROVIDER:
      console.log("DHT GET_PROVIDER");
      break;
    case DHT_MESSAGE_TYPE.FIND_NODE:
      console.log("DHT FIND_NODE");
      break;
    case DHT_MESSAGE_TYPE.PING:
      console.log("DHT PING");
      break;
    default:
      console.error("Invalid DHT Message type: ", message.type);
      break;
  }
};

const DEFAULT_BITSWAP_STRATEGY = async (cdnManager, message) => {
  const cids = message.wantlist.entries
    .filter((entry) => entry.wantType === 0)
    .map((entry) => multihashToCid(new CID(entry.block).multihash));
  console.log("Bitswap CIDs: ", cids);
};

const DEFAULT_CACHE_STRATEGY = async (
  cdnManager,
  protocol,
  message,
  peerId
) => {
  switch (protocol) {
    case KadDHTProtocol:
      DEFAULT_DHT_STRATEGY(cdnManager, message);
      break;

    default:
      DEFAULT_BITSWAP_STRATEGY(cdnManager, message);
      break;
  }
};

module.exports = {
  DEFAULT_CACHE_STRATEGY,
};
