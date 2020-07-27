const IPFS = require("ipfs");
const Repo = require("ipfs-repo");
const planetflareNode = require("./planetflare-node");
const PubSub = require("./pubsub");
const CDNManager = require("./cdn-manager");
const CacheProtocol = require("./protocols/cache-protocol");
const PaymentProtocol = require("./protocols/payment-protocol");
const RetrievalProtocol = require("./protocols/retrieval-protocol");

// Store data in /tmp directory. Data will be deleted on shutdown.
// TODO: Lock problems
const IPFS_LOCATION = "/tmp/ipfs-planetflare";

const createIPFSNode = async (metricsEnabled) => {
  let node;
  try {
    node = await IPFS.create({
      libp2p: planetflareNode(metricsEnabled),
      repo: new Repo(IPFS_LOCATION),
    });
  } catch (error) {
    if (error.code !== 'ERR_LOCK_EXISTS') {
      console.log(error);
      process.exit(1);
    }
    
    console.log('Waiting for lock to be released...');
    // Wait 5s before trying again
    await new Promise(resolve => setTimeout(resolve, 5000));
    node = createIPFSNode(metricsEnabled);
  }
  return node;
}

const main = async () => {
  const metricsEnabled = false;
  // [ { bucketId, hostId } ]
  const cdnFiles = [];

  // Start up our IPFS node with our custom libp2p wrapper
  const node = await createIPFSNode(metricsEnabled);

  console.log(`Started IPFS node at ${IPFS_LOCATION}.`);

  // Initialize CDN Manager
  const cdnManager = new CDNManager(node);

  // Enable cache protocol
  const cacheProtocol = new CacheProtocol(cdnManager);
  node.libp2p.handle(cacheProtocol.PROTOCOL, cacheProtocol.handler);

  // Enable payment protocol
  const paymentProtocol = new PaymentProtocol(cdnManager);
  node.libp2p.handle(paymentProtocol.PROTOCOL, paymentProtocol.handler);

  // Enable retrieval protocol
  const retrievalProtocol = new RetrievalProtocol(cdnManager);
  node.libp2p.handle(retrievalProtocol.PROTOCOL, retrievalProtocol.handler);

  // Create a PubSub client for each cdn file we're serving
  cdnFiles.forEach(
    ({ bucketId, hostId }) => new PubSub(libp2p, bucketId, hostId)
  );

  // If metrics are enabled, print bandwidth stats every 4 seconds
  // so we can see how our node is doing
  if (metricsEnabled) {
    setInterval(async () => {
      try {
        const stats = await node.stats.bw();
        console.log(`\nBandwidth Stats: ${JSON.stringify(stats, null, 2)}\n`);
      } catch (err) {
        console.log("An error occurred trying to check our stats:", err);
      }
    }, 4000);
  }

  const file = await cdnManager.storeData("Hello World!");
  const hasFile = await cdnManager.hasFile(file.cid);
  console.log(hasFile);

  // Watch for "close" command and run shutdown script
  process.stdin.on("data", async (data) => {
    // Remove trailing newline
    data = data.toString().trim();
    if (data === "close") {
      console.log(`Shutting down IPFS node...`);
      node
        .stop()
        .then(() => {
          console.log("Exiting...");
          process.exit(0);
        })
        .catch((err) => {
          console.log(`ERROR: ${err}`);
          process.exit(1);
        });
    }
  });
};

main();
