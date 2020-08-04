"use strict";

const PUBLISHER_NAME = `${location.hostname}` || "localhost:3000"; // Replace with publisher's API gateway.
const LOCAL_STORAGE_PFC_TOKENS = "pfc-tokens";
let remainingTokens =
  JSON.parse(localStorage.getItem(LOCAL_STORAGE_PFC_TOKENS)) || [];
let ipfs = null;

const providerManager = new ProviderManager();

/**
 * Ask for new tokens from the publisher.
 */
const requestTokens = async (num) => {
  const url = PUBLISHER_NAME;
  const response = await fetch(`http://${url}/get_tokens?num=${num}`);
  const { tokens } = await response.json();
  return tokens;
};

/**
 * Get data from IPFS
 */
const catFile = async (cid) => {
  if (ipfs == null) return;
  const chunks = [];
  for await (const chunk of ipfs.cat(cid)) {
    chunks.push(chunk.toString());
  }
  return chunks.join("");
};

/**
 * Keep track of providers that served files
 */
const onReceiveBlock = (bitswap) => (peerId, block, exists) => {
  bitswap._updateReceiveCountersInternal(peerId, block, exists);
  if (exists) return;
  providerManager.add(peerId, block.cid.toString());
};

const rewardProviders = (cid) => {
  const providers = providerManager.get(cid);
  if (providers == null || providers.length === 0) return;

  console.log(`Rewarding ${Object.keys(providers).join(', ')} for cid ${cid}`);

  // Once rewarded, remove to prevent buildup of stale data
  providerManager.remove(cid);
};

/**
 * Retrieve files from candidate providers.
 */
const getResources = async (pfcResources) => {
  const promises = pfcResources.map(async (resourceNode) => {
    /** Pass in `remainingTokens.pop()` */

    const cid = resourceNode.getAttribute("data-pfc");
    console.log(`Retrieving ${cid}...`);

    const data = await catFile(cid);
    console.log(`Data: ${data}`);
    resourceNode.innerHTML = data;
    rewardProviders(cid);
  });

  await Promise.all(promises);
};

const joinPubsubChannel = (cid) => {
  if (ipfs == null) return;
  if (pubsubChannels.hasOwnProperty(cid)) return;
  pubsubChannels[cid] = new RetrievePubsub(ipfs.libp2p, cid);
};

const main = async () => {
  /**
   * Scan the skeleton document for files available on PFC.
   */
  const pfcResources = Array.from(document.querySelectorAll("[data-pfc]"));

  pfcResources.map((resourceNode) => resourceNode.getAttribute("data-pfc"));

  const numMissingTokens = pfcResources.length - remainingTokens.length;

  if (numMissingTokens > 0) {
    const newTokens = await requestTokens(numMissingTokens);
    remainingTokens.push(...newTokens);
    localStorage.setItem(
      LOCAL_STORAGE_PFC_TOKENS,
      JSON.stringify(remainingTokens)
    );
  }

  getResources(pfcResources);
};

document.addEventListener("DOMContentLoaded", async () => {
  ipfs = await IPFS.create({ repo: "ipfs-" + Math.random() });

  // Hacky way to create a wrapper around internal bitswap function to retrieve provider IDs
  ipfs.bitswap.Bitswap._updateReceiveCountersInternal = ipfs.bitswap.Bitswap._updateReceiveCounters;
  ipfs.bitswap.Bitswap._updateReceiveCounters = onReceiveBlock(ipfs.bitswap.Bitswap);

  const status = ipfs.isOnline() ? "online" : "offline";
  console.log(`Node status: ${status}`);
  console.log(`Peer ID: ${ipfs.libp2p.peerId.toB58String()}`);

  main();
});
