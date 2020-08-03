"use strict";

const PUBLISHER_NAME = `${location.hostname}` || "localhost:3000"; // Replace with publisher's API gateway.
const LOCAL_STORAGE_PFC_TOKENS = "pfc-tokens";
let remainingTokens =
  JSON.parse(localStorage.getItem(LOCAL_STORAGE_PFC_TOKENS)) || [];
let ipfs = null;

/**
 * Ask for new tokens from the publisher.
 */
const requestTokens = async (num) => {
  const url = PUBLISHER_NAME;
  const response = await fetch(`http://${url}/get_tokens?num=${num}`);
  const { tokens } = await response.json();
  return tokens;
};

const catFile = async (cid) => {
  if (ipfs == null) return;
  const chunks = [];
  for await (const chunk of ipfs.cat(cid)) {
    chunks.push(chunk.toString());
  }
  return chunks.join("");
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
  ipfs = await Ipfs.create({ repo: "ipfs-" + Math.random() });
  const status = ipfs.isOnline() ? "online" : "offline";
  console.log(`Node status: ${status}`);
  console.log(`Peer ID: ${ipfs.libp2p.peerId.toB58String()}`);

  main();
});
