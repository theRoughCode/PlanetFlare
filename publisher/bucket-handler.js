const fs = require('fs').promises;
const credentials = require('credentials');
const { createUserAuth, Client, Bucket } = require("@textile/hub");
const { Libp2pCryptoIdentity } = require("@textile/threads-core");

/**
 * Provides utility functions for managing publisher Textile buckets.
 */
class BucketHandler {
  constructor() {
    const [keyInfo, secret] = credentials.getCredentialsTextile();
    this.keyInfo = keyInfo;
    this.secret = secret;
    this.indices = {}; 
  }

  setup = async () => {
    this.identity = await this.getTextileIdentity();
  }

  /**
   * Gets the user's identity, generated through libp2p. 
   * Tries to restore from cache before creating a new one. 
   */
  getTextileIdentity = async () => {
    const cached = localStorage.getItem("user-private-identity");
    if (cached !== null) {
      return Libp2pCryptoIdentity.fromString(cached);
    }
    const identity = await Libp2pCryptoIdentity.fromRandom();
    localStorage.setItem("identity", identity.toString());
    return identity;
  }

  /**
   * Initialize API and init / open a bucket.
   */
  getOrInit = async (bucketName) => {
    const buckets = Bucket.withKeyInfo(this.keyInfo);
    await buckets.getToken(this.identity);

    const { root, _ } = await buckets.getOrInit(bucketName);
    if (!root) {
      throw new Error(`Failed to open/create bucket ${bucketName}`);
    }

    return {
      buckets, bucketKey: root.key
    }
  }


  /**
   * Initializes/updates index with new files. Indices are used to
   * track which files exist in a publisher's bucket.
   */
  updateIndex = async (bucketName, filePath) => {
    const { buckets, bucketKey } = await this.getOrInit(bucketName);
    
    if (bucketName in this.indices) {
      const oldIndex = this.indices[bucketName];
      this.indices[bucketName] = {
        ...oldIndex,
        paths: [...oldIndex.paths, filePath]
      }
    } else {
      this.indices[bucketName] = {
        author: this.identity.public.toString(),
        date: (new Date()).getTime(),
        paths: []
      }
    }

    const index = this.indices[bucketName];
    const buf = Buffer.from(JSON.stringify(index, null, 2));
    const path = "index.json";
    await buckets.pushPath(bucketKey, path, buf);

    return index;
  }

  /**
   * Add file to bucket. 
   */
  addFile = async (bucketName, filePath) => {
    const { buckets, bucketKey } = await this.getOrInit(bucketName);
    const buffer = await fs.readFile(filePath);
    await this.updateIndex(bucketName, filePath);
    return buckets.pushPath(bucketKey, filePath, buffer);
  }

  /**
   * Report bucket bounty.
   */
  setBounty = async (bucketName) => {
    const { buckets, bucketKey } = await this.getOrInit(bucketName);
    const cid = await buckets.root(bucketKey.key);
    // payments  
  }

  /**
   * Push bucket update notification to subscribers.
   */
  updateSubscribers = async (bucketName) => {
    // ping pubsub
  }
  
  /**
   * Sign a given sequence of bytes.
   * @param {*} signeeBuf input buffer
   * @param {*} identity user identity object
   */
  sign = async (signeeBuf, identity) => {
    const challenge = Buffer.from(signeeBuf);
    const signed = identity.sign(challenge);
    return signed;
  }
}

module.exports = BucketHandler;