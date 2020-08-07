"use strict";

const PUBLISHER_NAME = `${location.hostname}` || "localhost:3001"; // Replace with publisher's API gateway.
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

  Object.keys(providers).forEach((peerId) =>
    rewardProvider(peerId, providers[peerId], cid)
  );

  // Once rewarded, remove to prevent buildup of stale data
  providerManager.remove(cid);
};

const rewardProvider = async (peerId, numBlocksServed, cid) => {
  if (ipfs == null) return;
  const multiaddr = `/ip4/127.0.0.1/tcp/5001/ws/p2p/${peerId}`;
  const protocol = "/planetflare/payment/1.0.0";
  try {
    const { stream } = await ipfs.libp2p.dialProtocol(multiaddr, protocol);
    if (remainingTokens.length < numBlocksServed) throw "Not enough tokens!";

    const tokens = remainingTokens
      .slice(0, numBlocksServed)
      .map((token) => JSON.stringify({ token, cid }));
    remainingTokens = remainingTokens.slice(numBlocksServed);
    await stream.sink(() => tokens);

    console.log(
      `Rewarded ${peerId} for serving ${numBlocksServed} blocks of cid ${cid} with tokens: ${tokens.join(
        ", "
      )}.`
    );

    stream.close();
  } catch (error) {
    console.error(`Failed to reward ${peerId}.\n${error}`);
  }
};

/**
 * Retrieve files from candidate providers.
 */
const getResources = async (pfcResources) => {
  const promises = pfcResources.map(async (resourceNode) => {
    const cid = resourceNode.getAttribute("data-pfc");
    console.log(`Retrieving ${cid}...`);

    const data = await catFile(cid);
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
  ipfs = await IPFS.create();

  // Hack to ensure we're connected to server node
  const serverPort = "60626";
  const serverAddr = `/ip4/127.0.0.1/tcp/${serverPort}/ws/p2p/QmNqu6TNZCmXVQgPcebjTBddf6yagPz2e29A7oMxmhd6dS`;
  await ipfs.swarm.connect(serverAddr);

  // Clear cache for demo
  for await (const res of ipfs.repo.gc()) {
  }

  // Hacky way to create a wrapper around internal bitswap function to retrieve provider IDs
  ipfs.bitswap.Bitswap._updateReceiveCountersInternal =
    ipfs.bitswap.Bitswap._updateReceiveCounters;
  ipfs.bitswap.Bitswap._updateReceiveCounters = onReceiveBlock(
    ipfs.bitswap.Bitswap
  );

  const status = ipfs.isOnline() ? "online" : "offline";
  console.log(`Node status: ${status}`);
  console.log(`Peer ID: ${ipfs.libp2p.peerId.toB58String()}`);

  main();
});
