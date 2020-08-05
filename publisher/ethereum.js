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

const getContractAddress = () => {
    return fs.readFileSync('./contract-address.txt', 'ascii').trim();
}

const getPlanetFlareABI = () => {
    return JSON.parse(fs.readFileSync('./build/contracts/PlanetFlareCoin.json')).abi;
}

const getPlanetFlareContract = (web3) => {
    return new web3.eth.Contract(getPlanetFlareABI(), getContractAddress());
}

module.exports = {
    getWeb3Instance,
    getUnlockedAccount,
    getPlanetFlareABI,
    getPlanetFlareContract,
    getContractAddress
}
