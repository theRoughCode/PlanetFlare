const retrieveSchema = {
  nested: {
    Message: {
      fields: {
        type: { type: "Type", id: 1 },
        multiaddr: { type: "string", id: 2 },
      },
      nested: { Type: { values: { WANT: 0, HAVE: 1 } } },
    },
  },
};
const proto = protobuf.Root.fromJSON(retrieveSchema);
const Message = proto.lookupType("Message");

/**
 * Pubsub channel for requesting files from Providers
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
   * Subscribes to `RetrievePubsub.topic`.
   * @private
   */
  join() {
    this.libp2p.pubsub.subscribe(this.topic, ({ from, data }) =>
      console.log(from, Message.toObject(Message.decode(data)))
    );
    console.log(`Joined pubsub topic: ${this.topic}`);
  }

  /**
   * Unsubscribes from `Chat.topic`
   * @private
   */
  leave() {
    this.libp2p.pubsub.unsubscribe(this.topic);
  }

  /**
   * Publishes the request for CID to pubsub peers
   * @throws
   */
  async request() {
    const msg = Message.create({ type: Message.Type.WANT });
    const buf = Message.encode(msg).finish();
    console.log(`Requesting ${this.cid} ${buf}`);

    await this.libp2p.pubsub.publish(this.topic, buf);
  }
}
