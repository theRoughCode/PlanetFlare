const fs = require("fs").promises;
const path = require("path");
const credentials = require('./common/credentials');
const { Buckets } = require("@textile/hub");
const { Libp2pCryptoIdentity } = require("@textile/threads-core");

/**
 * Provides utility functions for interacting with publisher Textile buckets.
 */
class BucketHandler {
  constructor() {
    const [keyInfo, secret] = credentials.getCredentialsTextile();
    this.keyInfo = keyInfo;
    this.secret = secret;
    this.indices = {};  // bucketKey -> (fileName -> cid)
  }

  async setup() {
    this.identity = await this.getTextileIdentity();
  }

  /**
   * Gets the user's identity, generated through libp2p. 
   */
  async getTextileIdentity(identityPath = 'textile-identity.txt') {
    try { 
      return Libp2pCryptoIdentity.fromString(await fs.readFile(identityPath));
    } catch {
      const result = await Libp2pCryptoIdentity.fromRandom();
      await fs.writeFile(identityPath, result.toString());
      return result;
    }
  }

  /**
   * Initialize gRPC client instance for buckets. 
   */
  async openClient() {
    const bucketClient = await Buckets.withKeyInfo(this.keyInfo);
    await bucketClient.getToken(this.identity);
    return bucketClient;
  }

  /**
   * Open a bucket, or create it if it already exists.
   */
  async getOrInit(bucketName) {
    const bucketClient = await this.openClient();

    let root; 
    try {
      root = await bucketClient.open(bucketName);
    } catch {
      root = await bucketClient.init(bucketName);
    }

    return {
      bucketClient, bucketKey: root.key
    }
  }

  /**
   * Get all files and directories in a given bucket. 
   */
  async getListPath(bucketName) {
    const { bucketClient, bucketKey } = await this.getOrInit(bucketName);
    const paths = await bucketClient.listPath(bucketKey);
    return paths.item.itemsList;
  }

  /**
   * Upsert files to bucket. 
   */
  async upsertFiles(bucketName, localFilePaths) {
    const { bucketClient, bucketKey } = await this.getOrInit(bucketName);
    const cidMap = {};

    for (let i = 0; i < localFilePaths.length; ++i) {
      try {
        const localFilePath = localFilePaths[i];
        const buffer = await fs.readFile(localFilePath);
        const filePath = path.basename(localFilePath);

        const file = { 
          path: filePath,
          content: buffer
        };
        console.log(`Pushing file ${localFilePath} to ${bucketKey}`);
        const res = await bucketClient.pushPath(bucketKey, filePath, file);
        cidMap[filePath] = res.path.cid.toString();

      } catch (err) {
        console.log(`Exception on ${localFilePaths[i]}`);
        console.log(error);
      }
    }

    await this.updateIndex(bucketName, cidMap);
  }

  /**
   * Remove files from bucket.
   */
  async removeFiles(bucketName, localFilePaths) {
    const { bucketClient, bucketKey } = await this.getOrInit(bucketName);

    for (let i = 0; i < localFilePaths.length; ++i) {
      try {
        const filePath = path.basename(localFilePaths[i]);
        await bucketClient.removePath(bucketKey, filePath);
      } catch {}
    }

    await this.updateIndex(bucketName, localFilePaths, true);
  }

  /**
   * Remove a Textile bucket. 
   */
  async removeBucket(bucketName) {
    const { bucketClient, bucketKey } = await this.getOrInit(bucketName);
    await bucketClient.remove(bucketKey);
    console.log(`Removed bucket ${bucketName}`);
  }

  /**
   * Initializes/updates index with new files. Indices are used to
   * track which files exist in a publisher's bucket.
   */
  async updateIndex(bucketName, newCidMap, remove = false) {
    const { bucketClient, bucketKey } = await this.getOrInit(bucketName);

    if (!(bucketKey in this.indices)) {
      this.indices[bucketKey] = {
        publisher: this.identity.public.toString(),
        date: (new Date()).getTime(),
        contents: {}
      }
    }

    const index = this.indices[bucketKey];

    for (const [fileName, cid] of Object.entries(newCidMap)) {
      if (remove) {
        try {
          delete index.contents[fileName];
        } catch {}
      } else {
        index.contents[fileName] = cid;
      }
    }

    const buf = Buffer.from(JSON.stringify(index, null, 2));
    const path = "index.json";
    await bucketClient.pushPath(bucketKey, path, buf);
    return index;
  }

  /**
   * Gets IPNS link for a bucket. 
   */
  async getIPNSLink(bucketName) {
    const { bucketClient, bucketKey } = await this.getOrInit(bucketName);
    const links = await bucketClient.links(bucketKey);
    return links.ipns;
  }

  /**
   * Sign a given sequence of bytes.
   * @param {*} signeeBuf input buffer
   * @param {*} identity user identity object
   */
  async sign(signeeBuf, identity) {
    const challenge = Buffer.from(signeeBuf);
    const signed = identity.sign(challenge);
    return signed;
  }
}

module.exports = BucketHandler;