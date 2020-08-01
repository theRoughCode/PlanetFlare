const IPFS = require("ipfs");
const Repo = require("ipfs-repo");
const libp2pConfig = require("./libp2p-config");
const PubSub = require("./pubsub");
const CDNManager = require("./cdn-manager");
const CacheProtocol = require("./protocols/cache-protocol");
const PaymentProtocol = require("./protocols/payment-protocol");
const RetrievalProtocol = require("./protocols/retrieval-protocol");
const { log } = require('./logger');

// Store data in /tmp directory.
const IPFS_LOCATION = "/tmp/ipfs-planetflare";

const createIPFSNode = async (metricsEnabled) => {
  let node;
  try {
    node = await IPFS.create({
      libp2p: libp2pConfig(metricsEnabled),
      repo: new Repo(IPFS_LOCATION),
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

const logStats = async (node) => {
  try {
    const stats = await node.stats.bw();
    log(`\nBandwidth Stats: ${JSON.stringify(stats, null, 2)}\n`);
  } catch (err) {
    console.log("An error occurred trying to check our stats:", err);
  }
};

class PlanetFlare {
  constructor(io, metricsEnabled = true) {
    this.io = io;
    this.metricsEnabled = metricsEnabled;
    // [ { bucketId, hostId } ]
    this.cdnFiles = [];
    this.location = IPFS_LOCATION;
    this.ready = false;
  }

  start = async () => {
    // Start up our IPFS node with our custom libp2p wrapper
    this.node = await createIPFSNode(this.metricsEnabled);
    this.peerId = this.node.libp2p.peerId.toB58String();
    console.log(
      `Started IPFS node:
            - Peer ID: ${this.peerId}
            - Location: ${this.location}`
    );

    // Initialize CDN Manager
    this.cdnManager = new CDNManager(this.node);

    this.initProtocols();
    this.initPubsub();

    this.ready = true;
    this.io.emit("status", {
      ready: true,
      peerId: this.peerId,
      location: this.location,
    });
  };

  initProtocols = () => {
    // Enable cache protocol
    const cacheProtocol = new CacheProtocol(this.cdnManager);
    cacheProtocol.PROTOCOLS.forEach((protocol) =>
      this.node.libp2p.handle(protocol, cacheProtocol.handler)
    );

    // Enable payment protocol
    const paymentProtocol = new PaymentProtocol(this.cdnManager);
    this.node.libp2p.handle(paymentProtocol.PROTOCOL, paymentProtocol.handler);

    // Enable retrieval protocol
    const retrievalProtocol = new RetrievalProtocol(this.cdnManager);
    this.node.libp2p.handle(
      retrievalProtocol.PROTOCOL,
      retrievalProtocol.handler
    );
  };

  initPubsub = () => {
    // Create a PubSub client for each cdn file we're serving
    this.cdnFiles.forEach(
      ({ bucketId, hostId }) => new PubSub(this.node.libp2p, bucketId, hostId)
    );
  };

  handleCommand = async (command, args) => {
    switch (command) {
      // Shut down node gracefully
      case "close":
        log(`Shutting down IPFS node...`);
        this.node
          .stop()
          .then(() => {
            log("Exiting...");
            process.exit(0);
          })
          .catch((err) => {
            log(`ERROR: ${err}`);
            process.exit(1);
          });
        break;

      // Print bandwidth stats
      case "stats":
        logStats(this.node);
        break;

      case "add-html":
        await this.cdnManager.storeFile(
          "C:/Users/Raphael/Documents/School/Hackathons/HackFs/PlanetFlare/provider/index.html"
        );
        break;

      default:
        log(command, args);
        break;
    }
  };
}

module.exports = PlanetFlare;
