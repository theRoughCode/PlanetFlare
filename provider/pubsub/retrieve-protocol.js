const protons = require("protons");
const { log } = require("../logger");

// Define Protobuf schema
const { Message } = protons(`
message Message {
  enum Type {
    WANT = 0;
    HAVE = 1;
  }
  required Type type = 1;
  optional string multiaddr = 2;
}
`);

/**
 * Pubsub channel for Providers to listen in on files requested by Clients
 */
class RetrievePubsub {
  /**
   *
   * @param {Libp2p} libp2p A Libp2p node to communicate through
   * @param {string} cid Content ID of file
   */
  constructor(libp2p, cid) {
    this.libp2p = libp2p;
    this.cid = cid;
    this.topic = `/planetflare/retrieve/1.0.0/${cid}`;
    this.addr = libp2p.multiaddrs.filter(addr => addr.endsWith("/ws"))[0];
    console.log(this.addr)

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
   * Subscribes to `RetrievePubsub.topic`. All messages will be
   * forwarded to `messageHandler`
   * @private
   */
  // TODO: Can allow customizable updating policies by passing into constructor and calling
  // them here
  join() {
    this.libp2p.pubsub.subscribe(this.topic, (message) => {
      const senderId = message.from;
      console.log(senderId, message.data);

      try {
        const { type } = Message.decode(message.data);
        if (type === Message.Type.WANT) log(`${senderId} wants ${this.cid}`);
      } catch (err) {
        console.error(err);
      }
    });
    log(`Joined pubsub topic: ${this.topic}`);
  }

  /**
   * Unsubscribes from `Chat.topic`
   * @private
   */
  leave() {
    this.libp2p.pubsub.unsubscribe(this.topic);
  }

  /**
   * Publishes the data requested
   * @throws
   */
  async send() {
    const msg = Message.encode({ type: Message.Type.HAVE,  });
    const buf = Message.encode(msg).finish();
    console.log(`Requesting ${this.cid} ${buf}`);

    await this.libp2p.pubsub.publish(this.topic, buf);
  }
}

module.exports = RetrievePubsub;
