const Web3 = require('web3');
const readline = require('readline');
const fs = require('fs');

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

let web3 = new Web3('ws://localhost:8545')

const PFCContractBuild = JSON.parse(fs.readFileSync('./build/contracts/PlanetFlareCoin.json'));
console.log(PFCContractBuild.abi);

rl.question('Enter deployed contract address: ', function (contractAddress) {
    let PlanetFlareContract = new web3.eth.Contract(PFCContractBuild.abi, contractAddress);
    console.log(PlanetFlareContract);
    rl.close();
});
