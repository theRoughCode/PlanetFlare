const fs = require("fs").promises;
const { Message } = require("../protocols/dht.proto");

const MESSAGE_TYPE = Message.MessageType;

const DEFAULT_CACHE_STRATEGY = async (cdnManager, msg, peerId) => {
  switch (msg.type) {
    case MESSAGE_TYPE.GET_VALUE:
      const { key } = msg;
      if (!cdnManager.hasFile(key)) {
        // Can choose to get data and cache
      }
      break;

    default:
      break;
  }
};

module.exports = {
  DEFAULT_CACHE_STRATEGY,
};
