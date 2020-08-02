const Web3 = require('web3');
const abi = require('ethereumjs-abi');
const credentials = require('credentials');
const fs = require('fs');

const getWeb3Instance = (path) => {
    return new Web3(path || 'ws://localhost:8545');
}


const getUnlockedAccount = (web3) => {
    return web3.privateKeyToAccount(credentials.getWeb3PrivateKey());
}


const getPlanetFlareContract = (web3) => {
    const contractAddress = fs.readFileSync('./contract-address.txt', 'ascii').trim();
    const contractABI = JSON.parse(fs.readFileSync('./build/contracts/PlanetFlareCoin.json')).abi;

    return new web3.eth.Contract(contractABI, contractAddress);
}
