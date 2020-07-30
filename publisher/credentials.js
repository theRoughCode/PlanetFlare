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

module.exports = {
  getCredentialsMongo,
  getCredentialsTextile,
}
