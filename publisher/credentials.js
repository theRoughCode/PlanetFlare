const getCredentials = () => {
    const fs = require('fs');
    const credentials = fs.readFileSync('credentials.txt').toString().split("\n");
    return credentials;
}

exports.getCredentials = getCredentials;