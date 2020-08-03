const Web3 = require('web3');
const abi = require('ethereumjs-abi');
const fs = require('fs');
const credentials = require('./common/credentials');

const getWeb3Instance = (path) => {
    return new Web3(path || 'ws://localhost:8545');
}


const getUnlockedAccount = (web3) => {
    return web3.eth.accounts.privateKeyToAccount(credentials.getWeb3PrivateKey());
}


const getPlanetFlareContract = (web3) => {
    const contractAddress = fs.readFileSync('./contract-address.txt', 'ascii').trim();
    const contractABI = JSON.parse(fs.readFileSync('./build/contracts/PlanetFlareCoin.json')).abi;

    return new web3.eth.Contract(contractABI, contractAddress);
}

module.exports = {
    getWeb3Instance,
    getUnlockedAccount,
    getPlanetFlareContract
}
