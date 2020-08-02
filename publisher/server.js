"use strict";
const express = require('express');
const uuid = require('uuid');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const [ dbname, password ] = require('./credentials').getCredentialsMongo();

const PORT = 3000;
const uri = `mongodb+srv://pfc:${password}@cluster0.8nmjg.mongodb.net/${dbname}?retryWrites=true&w=majority`;
const MONGO_COLLECTION = 'token';
const mongoClient = new MongoClient(uri, { useNewUrlParser: true });
const mongoConnection = mongoClient.connect();

const web3 = require('./ethereum').getWeb3Instance();
const account = require('./ethereum').getUnlockedAccount(web3);
const PlanetFlareContract = require('./ethereum').getPlanetFlareContract(web3);
const PaymentManager = require('./payment-manager');
const paymentManager = new PaymentManager(web3, account);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());


/**
 * Generate tokens for clients requesting them [GET]. 
 * Param: number of tokens (query string)
 */
app.get('/get_tokens', (req, res) => {
    const numTokens = req.query.num;
    const tokensBuffer = [];
    console.log(`Received request to fetch ${numTokens} tokens.`);

    for (let i = 0; i < numTokens; ++i) {
        tokensBuffer.push(uuid.v4());
    }

    const mongoDocs = tokensBuffer.map((token, _) => {
        return {
            tokenName: token
        }
    });
    mongoConnection.then(err => {
        const db = mongoClient.db(dbname).collection(MONGO_COLLECTION);
        db.insertMany(mongoDocs, (err, res) => {
            if (err) {
                console.log(`Error when inserting: ${err}`);
            }
            console.log(`Inserted ${res.insertedCount} tokens.`);
        });
    });

    console.log('Returning', tokensBuffer);
    res.json({tokens: tokensBuffer});
});


/**
 * Pay providers presenting clients' proofs-of-receipt [POST]. 
 * Params: tokens, providerId (body) 
 */
app.post('/verify_payment', (req, res) => {
    const tokens = req.body.tokens;
    const bountyID = req.body.bountyID;
    const recipientAddress = req.body.recipientAddress;

    if (!tokens) {
      res.status(400).json({error: 'No tokens provided'});
    }

    if (!recipientAddress) {
      res.status(400).json({error: 'No recipient address'});
    }

    if (!bountyID) {
      res.status(400).json({error: 'No bounty ID'});
    }

    let futurePayment = req.body.futurePayment;

    if (futurePayment) {
      if (!paymentManager.verifyFuturePayment(futurePayment)) {
        res.status(401).json({error: 'Invalid future payment'});
      }
    } else {
      // TODO: optional, verify that the given bounty ID exists before continuing
      futurePayment = paymentManager.createFuturePayment(recipientAddress, bountyID);
      console.log('created future payment', futurePayment);
    }

    console.log(`tokens: ${tokens}`);

    mongoConnection.then(err => {
      if (err) {
          console.log(err);
      }

      const db = mongoClient.db(dbname).collection(MONGO_COLLECTION);

      db.deleteMany({
        tokenName: {
          $in : tokens
        }
      }).then(result => {
        paymentManager.incrementFuturePayment(futurePayment, result.result.n);
        res.json(futurePayment);
      })
    });
    /**
     * <PFC payment integration>
     */
});


/**
 * Upload and distribute a new piece of content onto PlanetFlare.
 */
app.post('/create', (req, res) => {

});


/**
 * Deprecate a piece of content. 
 */
app.post('/delete', (req, res) => {

});


app.listen(PORT, () => {
    console.log(`Publisher listening on port ${PORT}`)
});


process.on('uncaughtException', err => {
    console.log(err);
}); 
