const fs = require("fs");
const axios = require("axios");
const Web3 = require("web3");
const IPFS = require("ipfs");
const Repo = require("ipfs-repo");
const libp2pConfig = require("./libp2p-config");
const UpdatePubsub = require("./pubsub/update-protocol");
const CDNManager = require("./cdn-manager");
const CacheProtocol = require("./protocols/cache-protocol");
const PaymentProtocol = require("./protocols/payment-protocol");
const RetrievalProtocol = require("./protocols/retrieval-protocol");
const { CACHE_STRATEGIES } = require("./strategies/cache-strategy");
const { PAYMENT_STRATEGIES } = require("./strategies/payment-strategy");
const { log, error } = require("./logger");
const PFC = require("./build/contracts/PlanetFlareCoin");

// Store data in /tmp directory.
const IPFS_LOCATION = "/tmp/ipfs-planetflare";

// Hardcoded endpoint to claim payment
const PUBLISHER_ENDPOINT = "http://localhost:3001";

// Hardcoded endpoint to web3
const WEB3_ENDPOINT = "ws://localhost:8545";

// Interval to update UI state
const UI_UPDATE_RATE = 1500;

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
    this.paymentStrategy = "DEFAULT";
    this.cacheStrategy = "DEFAULT";
    this.abi = PFC.abi;
    this.web3 = new Web3(WEB3_ENDPOINT);
    this.ioUpdater = null;
    this.cachedBuckets = JSON.parse(fs.readFileSync("cached-buckets.json"));
    fs.readFile("./contract-address.txt", "utf8", (err, data) => {
      if (err) {
        console.error("Failed to read contract-address.txt", err);
        return;
      }
      this.contractAddress = data.trim();
      this.pfcContract = new this.web3.eth.Contract(
        this.abi,
        this.contractAddress
      );
    });
  }

  start = async () => {
    log(`Starting IPFS node...`);
    // Start up our IPFS node with our custom libp2p wrapper
    this.node = await createIPFSNode(this.metricsEnabled);
    this.peerId = this.node.libp2p.peerId.toB58String();
    log(
      `Started IPFS node:
            - Peer ID: ${this.peerId}
            - Location: ${this.location}
            - Multiaddrs: ${this.node.libp2p.multiaddrs
              .map((addr) => addr.toString())
              .join(", ")}`
    );

    // Initialize CDN Manager
    this.cdnManager = new CDNManager(this.node);

    this.initProtocols();
    await this.initPubsub();

    this.ready = true;
    this.io.emit("status", {
      ready: true,
      peerId: this.peerId,
      location: this.location,
      paymentStrategies: Object.keys(PAYMENT_STRATEGIES),
      cacheStrategies: Object.keys(CACHE_STRATEGIES),
      tokens: this.paymentProtocol.tokens || {},
    });

    // Start sending updates of node state to frontend
    this.startIoUpdater();
    this.updatePinnedFiles();
  };

  stop = async () => {
    log("Shutting down IPFS node...");
    await this.node.stop();
    log("Stopped IPFS node.");
    this.io.emit("status", { ready: false });
    clearInterval(this.ioUpdater);
    this.ioUpdater = null;
  };

  initProtocols = () => {
    // Enable cache protocol
    this.cacheProtocol = new CacheProtocol(this.cdnManager, this.cacheStrategy);
    this.cacheProtocol.PROTOCOLS.forEach((protocol) =>
      this.node.libp2p.handle(protocol, this.cacheProtocol.handler)
    );

    // Enable payment protocol
    this.paymentProtocol = new PaymentProtocol(this.io, this.paymentStrategy);
    this.node.libp2p.handle(
      this.paymentProtocol.PROTOCOL,
      this.paymentProtocol.handler
    );

    // Enable retrieval protocol
    this.retrievalProtocol = new RetrievalProtocol(this.cdnManager);
    this.node.libp2p.handle(
      this.retrievalProtocol.PROTOCOL,
      this.retrievalProtocol.handler
    );
  };

  initPubsub = async () => {
    // Create a PubSub client for each cdn file we're serving
    this.cdnFiles.forEach(
      ({ bucketId, hostId }) =>
        new UpdatePubsub(this.node.libp2p, bucketId, hostId)
    );
    const pinnedFiles = await this.cdnManager.getPinnedFiles();
  };

  startIoUpdater = () => {
    this.ioUpdater = setInterval(() => {
      // Update PFC balance
      this.getPfcBalance()
        .then((balance) => this.io.emit("balance", balance))
        .catch(console.error);
    }, UI_UPDATE_RATE);
  };

  // Update pinned files
  updatePinnedFiles = () => {
    this.cdnManager
      .getPinnedFiles()
      .then((files) => {
        files = files.map(({ cid }) => cid.toString());
        this.io.emit("pinned-files", files);
      })
      .catch(() => `Failed to get pinned files. ${err.message}.`);
  };

  provideBucketContents = async (bucketId) => {
    const ipnsPage = `https://hub.textile.io/ipns/${bucketId}/index.json`;
    const page = await axios.get(ipnsPage);
    const contents = page.data.contents;
    const cids = Object.values(contents);
    await Promise.all(
      cids.map(async (cid) => {
        await this.cdnManager.retrieveFileFromRemote(cid, true, true);
        // Store mapping from cid to bucket id
        this.cachedBuckets[cid] = bucketId;
      })
    );

    this.updatePinnedFiles();

    console.log("Cached buckets: ", this.cachedBuckets);
    fs.writeFileSync("cached-buckets.json", JSON.stringify(this.cachedBuckets));
  };

  provideContents = async (cid) => {
    await this.cdnManager.retrieveFileFromRemote(cid, true, true);
    this.updatePinnedFiles();
  };

  setWalletAddress = (walletAddress) => {
    console.log(`Setting walletAddress to ${walletAddress}`);
    this.walletAddress = walletAddress;
  };

  submitTokens = () => {
    const tokens = this.paymentProtocol.tokens;
    Object.keys(tokens).forEach((cid) =>
      this.submitTokensForCid(tokens[cid], cid)
    );
  };

  submitTokensForCid = async (tokens, cid) => {
    try {
      log(`Submitting tokens: [${tokens.join(", ")}] for cid ${cid}`);
      if (!this.cachedBuckets.hasOwnProperty(cid)) {
        // Try converting to v0
        cid = cid.toV0();
        if (!this.cachedBuckets.hasOwnProperty(cid))
          throw `Cannot find bucket id for ${cid}!`;
      }
      const bucketID = this.cachedBuckets[cid];
      console.log("bucket id: ", bucketID);
      const res = await axios.post(PUBLISHER_ENDPOINT + "/verify_payment", {
        tokens,
        bucketID,
        recipientAddress: this.walletAddress,
      });
      const { data, signature } = res.data;
      const { bountyID, numTokens, nonce } = data;
      log(`Received response from publisher: ${JSON.stringify(res.data)}`);

      await this.pfcContract.methods
        .claimPayment(bountyID, numTokens, nonce, signature)
        .send({ from: this.walletAddress });
    } catch (err) {
      console.error(err);
      error(`Failed to submit tokens. ${err}`);
    }
  };

  getPfcBalance = async () => {
    const balance = await this.pfcContract.methods
      .balanceOf(this.walletAddress)
      .call();
    return balance;
  };

  handleCommand = async (command, args) => {
    log(command, args);
    switch (command) {
      // Shut down node gracefully
      case "close":
        this.stop().catch((err) => {
          error(`ERROR: ${err}`);
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

      case "set-cache-strategy":
        const { cacheStrategy } = args;
        this.cacheProtocol.setCacheStrategy(cacheStrategy);
        break;

      case "set-payment-strategy":
        const { paymentStrategy } = args;
        this.paymentProtocol.setPaymentStrategy(paymentStrategy);
        break;

      case "submit-tokens":
        this.submitTokens();
        break;

      case "provide-bucket":
        const bucketId = args[0];
        this.provideBucketContents(bucketId);
        break;

      case "provide-data":
        const cid = args[0];
        this.provideContents(cid);
        break;

      case "ls-pinned":
        this.cdnManager.getPinnedFiles().then(console.log).catch(console.error);
        break;

      case "clear-pinned":
        this.cdnManager.unpinFiles();
        break;

      case "get-balance":
        const balance = await this.getPfcBalance();
        console.log("balance: " + balance);
        break;

      default:
        break;
    }
  };
}

module.exports = PlanetFlare;
