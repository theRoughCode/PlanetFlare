/**
 * Provides utility functions for managing local CDN.
 */
class CDNManager {
  constructor(ipfs) {
    this.ipfs = ipfs;
  }

  hasFile = async (cId) => {
    for await (const ref of this.ipfs.refs.local()) {
        if (ref.err) console.error(ref.err);
        else if (ref.ref === cId) return true;
    }
    return false;
  }

  getCksum(cId) {
    // Get checksum of file with given cId
  }

  getFile(cId) {
      // return cksum + data
  }
}

module.exports = CDNManager;
