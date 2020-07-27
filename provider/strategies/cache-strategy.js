const fs = require("fs").promises;
const { multihashToCid } = require("../utils");
const { Message } = require("../protocols/dht.proto");

const MESSAGE_TYPE = Message.MessageType;

const DEFAULT_CACHE_STRATEGY = async (cdnManager, msg, peerId) => {
  switch (msg.type) {
    case MESSAGE_TYPE.GET_VALUE:
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

    default:
      break;
  }
};

module.exports = {
  DEFAULT_CACHE_STRATEGY,
};
