const fs = require("fs").promises;
const { multihashToCid } = require("../utils");
const { Message } = require("../protocols/dht.proto");

const MESSAGE_TYPE = Message.MessageType;

const DEFAULT_CACHE_STRATEGY = async (cdnManager, msg, peerId) => {
  switch (msg.type) {
    case MESSAGE_TYPE.GET_VALUE:
    case MESSAGE_TYPE.ADD_PROVIDER:
      let cid;
      try {
        cid = multihashToCid(msg.key);
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
    case MESSAGE_TYPE.PUT_VALUE:
      console.log("DHT PUT");
      break;
    case MESSAGE_TYPE.GET_PROVIDER:
      console.log("DHT GET_PROVIDER");
      break;
    case MESSAGE_TYPE.FIND_NODE:
      console.log("DHT FIND_NODE");
      break;
    case MESSAGE_TYPE.PING:
      console.log("DHT PING");
      break;
    default:
      console.error("Invalid DHT Message type: ", msg.type);
      break;
  }
};

module.exports = {
  DEFAULT_CACHE_STRATEGY,
};
