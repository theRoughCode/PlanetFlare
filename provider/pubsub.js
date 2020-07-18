const protons = require("protons");

// Define Protobuf schema
const { Message } = protons(`
message Message {
  enum Type {
    UPDATE_FILE = 0;
    REMOVE_FILE = 1;
    ADD_FILE = 2;
  }

  required Type type = 1;
  optional UpdateFile updateFile = 2;
  optional RemoveFile removeFile = 3;
  optional AddFile addFile = 4;
}

message UpdateFile {
    required bytes cId = 1;
}

message RemoveFile {
    required bytes cId = 1;
}

message AddFile {
    required bytes cId = 1;
}
`);

/**
 * PubSub channel for Providers to listen in on updated files by Publishers
 */
class PubSub {
  /**
   *
   * @param {Libp2p} libp2p A Libp2p node to communicate through
   * @param {string} bucketId Content ID of bucket
   * @param {PeerId} publisherId Peer ID of publisher that owns bucket
   */
  constructor(libp2p, bucketId, publisherId) {
    this.libp2p = libp2p;
    this.topic = `/planetflare/pubsub/1.0.0/${bucketId}`;
    this.publisherId = publisherId.toB58String();

    // Join if libp2p is already on
    if (this.libp2p.isStarted()) this.join();
  }

  /**
   * Handler that is run when `this.libp2p` starts
   */
  onStart() {
    this.join();
  }

  /**
   * Handler that is run when `this.libp2p` stops
   */
  onStop() {
    this.leave();
  }

  /**
   * Subscribes to `PubSub.topic`. All messages will be
   * forwarded to `messageHandler`
   * @private
   */
  // TODO: Can allow customizable updating policies by passing into constructor and calling
  // them here
  join() {
    this.libp2p.pubsub.subscribe(this.topic, (message) => {
      // Only allow publisher to send messages
      if (message.from !== this.publisherId) return;

      try {
        const { type, updateFile, removeFile, addFile } = Message.decode(
          message.data
        );

        let cid;

        switch (type) {
          case Message.Type.UPDATE_FILE:
            cId = updateFile.cId.toString();
            console.info(`Updating: ${cId}`);
            break;
          case Message.Type.ADD_FILE:
            cId = addFile.cId.toString();
            console.info(`Adding: ${cId}`);
            break;
          case Message.Type.REMOVE_FILE:
            cId = removeFile.cId.toString();
            console.info(`Removing: ${cId}`);
            break;
          default:
          // Do nothing
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  /**
   * Unsubscribes from `Chat.topic`
   * @private
   */
  leave() {
    this.libp2p.pubsub.unsubscribe(this.topic);
  }
}

module.exports = PubSub;
