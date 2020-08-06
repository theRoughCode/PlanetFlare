const all = require("it-all");
const fs = require("fs").promises;
const { multihashToCid } = require("./utils");
const { log, error } = require("./logger");

/**
 * Provides utility functions for managing local CDN.
 */
class CDNManager {
  constructor(ipfs) {
    this.ipfs = ipfs;
  }

  hasFile = async (cid) => {
    const pinnedFiles = await this.getPinnedFiles();

    for (const pinned of pinnedFiles) {
      if (pinned.cid.toString() === cid) return true;
    }
    return false;
  };

  getCksum = (cid) => {
    // Get checksum of file with given cid
  };

  getFile = (cid) => {
    // return data
  };

  getPinnedFiles = async () => {
    const pinnedFiles = [];
    try {
      for await (const pinned of this.ipfs.pin.ls()) {
        pinnedFiles.push(pinned);
      }
    } catch (error) {
      console.error(error);      
    }
    return pinnedFiles;
  };

  pinFile = (cid) => {
    this.ipfs.pin
      .add(cid)
      .then(() => log(`Pinned ${cid}.`))
      .catch(() => `Failed to pin ${cid}. ${err}`);
  };

  unpinFiles = async () => {
    for await (const { cid } of this.ipfs.pin.ls()) {
      this.ipfs.pin
        .rm(cid)
        .catch((err) => `Failed to unpin ${cid.toString()}. ${err}`);
    }
  };

  /**
   * Announce to DHT that we are providing the given `cid`.
   */
  provideFile = async (cid, timeout = 5000) => {
    try {
      await all(this.ipfs.dht.provide(cid, { timeout }));
      log(`Provided ${cid}.`);
    } catch (err) {
      console.error(`Failed to provide ${cid}: ${err}.`);
    }
  };

  /**
   * Stores data from file at given `path` in local node.
   */
  storeFile = async (path) => {
    try {
      const data = await fs.readFile(path, "utf8");
      return await this.storeData(data);
    } catch (err) {
      error(`ERROR: Failed to read file from ${path}.`);
      return null;
    }
  };

  /**
   * Stores data in local node (wrapper for `ipfs.add`).
   * Data stored are pinned by default.
   */
  storeData = async (data, path = null) => {
    if (path != null) {
      data = {
        path,
        content: data,
      };
    }

    const file = await this.ipfs.add(data);
    log(`Added file: ${file.path}, ${file.cid}`);

    return file;
  };

  /**
   * Retrieves block from IPFS with given CID.
   *
   * @param {CID} cid CID of content.
   * @param {bool} store Stores file locally if true.
   * @param {bool} provide Announces to DHT that we are providing the file (only
   *                       if `store` is true).
   *
   * @returns remote block or local block (if `store` is true).
   */
  retrieveFileFromRemote = async (cid, store = false, provide = true) => {
    const block = await this.ipfs.block.get(cid);
    log(`Retrieved remote file: ${block.cid}`);

    if (store) {
      const localBlock = await this.ipfs.block.put(block.data);
      log(`Stored remote file: ${localBlock.cid}`);
      this.pinFile(localBlock.cid);

      if (provide) await this.provideFile(localBlock.cid);

      return localBlock;
    }

    return block;
  };
}

module.exports = CDNManager;
