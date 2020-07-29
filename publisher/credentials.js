const { Libp2pCryptoIdentity } = require("@textile/threads-core");
const { Client } = require("@textile/hub");
const fs = require("fs");

/**
 * Reads MongoDB dbname (first line) + PW (second line)
 * from secret file. 
 */
const getCredentialsMongo = () => {
    const credentials = fs.readFileSync("mongo-credentials.txt").toString().split("\n");
    return credentials;
}

/**
 * Reads textile insecure key (first line) and secret (second line)
 * from secret file. 
 */
const getCredentialsTextile = () => {
    const [key, secret] = fs.readFileSync("hub-credentials.txt").toString().split("\n");
    return [ {key}, secret ];
}

/**
 * Gets the user's identity, generated through libp2p. 
 * Tries to restore from cache before creating a new one. 
 */
const getTextileIdentity = async () => { 
  const cached = localStorage.getItem("user-private-identity");
  if (cached !== null) {
    return Libp2pCryptoIdentity.fromString(cached);
  }
  const identity = await Libp2pCryptoIdentity.fromRandom();
  localStorage.setItem("identity", identity.toString());
  return identity;
}

/**
 * Sign a given sequence of bytes.
 * @param {*} signeeBuf input buffer
 * @param {*} identity user identity object
 */
const sign = async (signeeBuf, identity) => {
  const challenge = Buffer.from(signeeBuf);
  const signed = identity.sign(challenge);
  return signed;
}

/**
 * Open Textile Bucket client. 
 * @param {*} devKey user key (no signature required)
 * @param {*} identity user identity object
 */
const authorize = async (devKey, identity) => {
  const client = await Client.withKeyInfo(devKey);
  await client.getToken(identity);
  return client; 
}

module.exports = {
  getCredentialsMongo,
  getCredentialsTextile,
  getTextileKey,
  getTextileIdentity,
  sign,
  authorize
}
