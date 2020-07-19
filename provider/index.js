const IPFS = require('ipfs');
const planetflareNode = require('./planetflare-node');
const PubSub = require('./pubsub');
const CDNManager = require('./cdn-manager');
const RetrievalProtocol = require('./protocols/retrieval-protocol');
const PaymentProtocol = require('./protocols/payment-protocol');

const main = async () => {
    const metricsEnabled = false;
    // [ { bucketId, hostId } ]
    const cdnFiles = [];

    // Start up our IPFS node with our custom libp2p wrapper
    const node = await IPFS.create({
        libp2p: planetflareNode(metricsEnabled),
    });

    // Initialize CDN Manager
    const cdnManager = new CDNManager(node);

    // Enable retrieval protocol
    const retrievalProtocol = new RetrievalProtocol(cdnManager);
    node.libp2p.handle(retrievalProtocol.PROTOCOL, retrievalProtocol.handler);

    // Enable payment protocol
    const paymentlProtocol = new PaymentProtocol(cdnManager);
    node.libp2p.handle(paymentlProtocol.PROTOCOL, paymentlProtocol.handler);

    // Create a PubSub client for each cdn file we're serving
    cdnFiles.forEach(({ bucketId, hostId }) => new PubSub(libp2p, bucketId, hostId));

    // If metrics are enabled, print bandwidth stats every 4 seconds
    // so we can see how our node is doing
    if (metricsEnabled) {
        setInterval(async () => {
            try {
                const stats = await node.stats.bw()
                console.log(`\nBandwidth Stats: ${JSON.stringify(stats, null, 2)}\n`)
            } catch (err) {
                console.log('An error occurred trying to check our stats:', err)
            }
        }, 4000);
    }

    // const fileAdded = await node.add({
    //     path: 'hello.txt',
    //     content: 'Hello World 101'
    // });

    // console.log('Added file:', fileAdded.path, fileAdded.cid);
};

main();