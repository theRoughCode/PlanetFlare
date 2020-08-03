const all = require("it-all");
const BucketHandler = require("./bucket-handler");
const IPFS = require("ipfs");
const Repo = require("ipfs-repo");
const libp2pConfig = require("./libp2p-config");

const createIPFSNode = async (metricsEnabled, ipfsLocation = '/tmp/ipfs-planetflare-publisher') => {
  let node;
  try {
    node = await IPFS.create({
      libp2p: libp2pConfig(metricsEnabled),
      repo: new Repo(ipfsLocation),
    });
  } catch (error) {
    if (error.code !== "ERR_LOCK_EXISTS") {
      console.log(error);
      process.exit(1);
    }

    console.log("Waiting for lock to be released...");
    // Wait 5s before trying again
    await new Promise((resolve) => setTimeout(resolve, 5000));
    node = createIPFSNode(metricsEnabled);
  }
  return node;
};

class PlanetFlarePublisher {
  constructor(metricsEnabled = true, ipfsLocation = '/tmp/ipfs-planetflare-publisher') {
    this.metricsEnabled = metricsEnabled;
    this.location = ipfsLocation;
    this.ready = false;
  }

  async start() {
    // Start up our IPFS node with our custom libp2p wrapper
    this.node = await createIPFSNode(this.metricsEnabled);
    this.peerId = this.node.libp2p.peerId.toB58String();
    console.log(
      `Started IPFS node:
            - Peer ID: ${this.peerId}
            - Location: ${this.location}`
    );

    this.bucketHandler = new BucketHandler();
    await this.bucketHandler.setup();

    this.ready = true;
  };

  async stop() {
    await this.node.stop();
  };

  /**
   * Announce to DHT that we are providing the given `cid`.
   */
  async provideFile(cid, timeout = 1000) {
    try {
      await all(this.node.dht.provide(cid, { timeout }));
      console.log(`Provided ${cid}.`);
    } catch (err) {
      console.error(`Failed to provide ${cid}: ${err}.`);
    }
  };
}

module.exports = PlanetFlarePublisher;
