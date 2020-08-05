const fs = require("fs");

/**
 * Reads MongoDB dbname (first line) + PW (second line)
 * from secret file. 
 */
const getCredentialsMongo = () => {
    const credentials = fs.readFileSync("mongo-credentials.txt").toString().trim().split("\n");
    return credentials;
}

const getWeb3PrivateKey = () => {
  const privateKey = fs.readFileSync('web3-private-key.txt').toString().trim();
  return privateKey;
}

/**
 * Reads textile insecure key (first line) and secret (second line)
 * from secret file. 
 */
const getCredentialsTextile = () => {
    const [key, secret] = fs.readFileSync("hub-credentials.txt").toString().trim().split("\n");
    return [ {key}, secret ];
}

module.exports = {
  getCredentialsMongo,
  getCredentialsTextile,
  getWeb3PrivateKey
}
