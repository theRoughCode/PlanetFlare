const Web3 = require('web3');
const readline = require('readline');
const fs = require('fs');
const PaymentChannel = require('./payment-channel');
const { create } = require('domain');
const { randomBytes } = require('crypto');

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

let web3 = new Web3('ws://localhost:8545')

const PFCContractBuild = JSON.parse(fs.readFileSync('./build/contracts/PlanetFlareCoin.json'));

const contractAddress = fs.readFileSync('./contract-address.txt', 'ascii').trim();

let PlanetFlareContract = new web3.eth.Contract(PFCContractBuild.abi, contractAddress);

var primaryAccount = web3.eth.accounts.privateKeyToAccount('0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d');
var secondaryAccount = web3.eth.accounts.privateKeyToAccount('0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1')

function getPrimaryBalance(callback) {
    PlanetFlareContract.methods.balanceOf(secondaryAccount.address).call(callback);
}

function transferPFC(amount, callback) {
    PlanetFlareContract.methods.transfer(secondaryAccount.address, amount).send(
        {from: primaryAccount.address},
        callback
    );
}

function createBounty(cid, costPerToken, deposit, callback) {
    PlanetFlareContract.methods.createBounty(cid, costPerToken, deposit).send(
        { from: primaryAccount.address, gas: 100000000 },
    ).then(callback)
    .catch(console.log);
}

function getBountyIDs(publisher, callback) {
    PlanetFlareContract.methods.getBountiesForPublisher(publisher).call(callback);
}

function getBounty(id, callback) {
    PlanetFlareContract.methods.getBounty(id).call(callback)
}

function paymentChannelTest() {
    var bountyID = '88735044318772147556240327665446902972523722668274298936251860056363735820129';
    var amount = 100;
    var nonce = Math.floor(Math.random() * 10000000);

    let signatureHash = PaymentChannel.generateSignatureHash(
        secondaryAccount.address,
        bountyID,
        amount,
        nonce
    );
    console.log(primaryAccount);

    let signature = web3.eth.accounts.sign(signatureHash, primaryAccount.privateKey).signature;

    PlanetFlareContract.methods.claimPayment(
        bountyID,
        amount,
        nonce,
        signature
    ).send({from: secondaryAccount.address}).then(console.log).catch(console.log)
}

function deleteBounty() {
    PlanetFlareContract.methods.deleteBounty(
        '88735044318772147556240327665446902972523722668274298936251860056363735820129'
    ).send({ from: primaryAccount.address }).then(console.log);
}

// transferPFC(100, console.log);
// createBounty('example-cid', 5, 200, function (receipt) {
//     console.log(receipt.events['BountyUpdate'].returnValues);
// });

// getBountyIDs(primaryAccount.address, function(error, bountyIDs) {
//     bountyIDs.forEach(id => getBounty(id, (_, r) => console.log(r)));
// });

// paymentChannelTest();

deleteBounty();
