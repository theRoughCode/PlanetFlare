"use strict";

const PUBLISHER_NAME = `${location.hostname}` || "localhost:3000"; // Replace with publisher's API gateway.
let remainingTokens = [];
let ipfs = null;

/**
 * Ask for new tokens from the publisher.
 */
const requestTokens = async (num) => {
  const url = PUBLISHER_NAME;
  const response = await fetch(`http://${url}/get_tokens?num=${num}`);
  const results = await response.json();
  return JSON.parse(results)["tokens"];
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

const main = async () => {
  /**
   * Scan the skeleton document for files available on PFC.
   */
  const pfcResources = Array.from(document.querySelectorAll("[data-pfc]"));

  if (pfcResources.length > 0) {
    // remainingTokens = await requestTokens(pfcResources.length);
    getResources(pfcResources);
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  ipfs = await Ipfs.create({ repo: "ipfs-" + Math.random() });

  const status = ipfs.isOnline() ? "online" : "offline";

  console.log(`Node status: ${status}`);

  main();
});
