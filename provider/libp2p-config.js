'use strict'

const Libp2p = require('libp2p')
const IPFS = require('ipfs')
const TCP = require('libp2p-tcp')
const Websockets = require('libp2p-websockets')
const MulticastDNS = require('libp2p-mdns')
const Bootstrap = require('libp2p-bootstrap')
const KadDHT = require('libp2p-kad-dht')
const Mplex = require('libp2p-mplex')
const { NOISE } = require('libp2p-noise')
const SECIO = require('libp2p-secio')
const Gossipsub = require('libp2p-gossipsub')

/**
 * Options for the libp2p bundle
 * @typedef {Object} libp2pBundle~options
 * @property {PeerId} peerId - The PeerId of the IPFS node
 * @property {Object} config - The config of the IPFS node
 * @property {Object} options - The options given to the IPFS node
 */

/**
 * This is the bundle we will use to create our fully customized libp2p bundle.
 *
 * @param {bool} metricsEnabled True if user wants to log out metrics
 * @param {libp2pBundle~options} opts The options to use when generating the libp2p node
 * @returns {Libp2p} Our new libp2p node
 */
const libp2pConfig = (metricsEnabled = false) => (opts) => {
  // Set convenience variables to clearly showcase some of the useful things that are available
  const peerId = opts.peerId
  const bootstrapList = opts.config.Bootstrap

  // Build and return our libp2p node
  // n.b. for full configuration options, see https://github.com/libp2p/js-libp2p/blob/master/doc/CONFIGURATION.md
  return new Libp2p({
    peerId,
    addresses: {
      listen: [
        '/ip4/0.0.0.0/tcp/0',
        '/ip4/0.0.0.0/tcp/0/ws',
      ]
    },
    modules: {
      transport: [ TCP, Websockets ],
      streamMuxer: [ Mplex ],
      connEncryption: [ NOISE, SECIO ],
      peerDiscovery: [ Bootstrap, MulticastDNS ],
      dht: KadDHT,
      pubsub: Gossipsub,
    },
    config: {
      peerDiscovery: {
        autoDial: true, // auto dial to peers we find when we have less peers than `connectionManager.minPeers`
        mdns: {
          interval: 10000,
          enabled: true
        },
        bootstrap: {
          interval: 30e3,
          enabled: true,
          list: bootstrapList
        }
      },
      // Turn on relay with hop active so we can connect to more peers
      relay: {
        enabled: true,
        hop: {
          enabled: true,
          active: true
        }
      },
      dht: {
        enabled: true,
        kBucketSize: 20,
        randomWalk: {
          enabled: true,
          interval: 10e3, // This is set low intentionally, so more peers are discovered quickly. Higher intervals are recommended
          timeout: 2e3 // End the query quickly since we're running so frequently
        }
      },
      pubsub: {
        enabled: true
      }
    },
    metrics: {
      enabled: metricsEnabled,
      computeThrottleMaxQueueSize: 1000,  // How many messages a stat will queue before processing
      computeThrottleTimeout: 2000,       // Time in milliseconds a stat will wait, after the last item was added, before processing
      movingAverageIntervals: [           // The moving averages that will be computed
        60 * 1000, // 1 minute
        5 * 60 * 1000, // 5 minutes
        15 * 60 * 1000 // 15 minutes
      ],
      maxOldPeersRetention: 50            // How many disconnected peers we will retain stats for
    }
  })
};

module.exports = libp2pConfig;
