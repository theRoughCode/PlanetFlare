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
    res.json(JSON.stringify({'tokens': tokensBuffer}));
});


/**
 * Pay providers presenting clients' proofs-of-receipt [POST]. 
 * Params: tokens, providerId (body) 
 */
app.get('/verify_payment', (req, res) => {
    const tokens = res.body.tokens;
    const providerId = res.body.providerId;
    let successCount = 0;
    console.log(`Received request to pay up to provider ${providerId}`).

    mongoConnection.then(err => {
        if (err) {
            console.log(err);
        }

        const db = mongoClient.db(dbname).collection(MONGO_COLLECTION);
        tokens.forEach(token => {
            db.deleteOne({
                tokenName: token
            }, (err, res) => {
                if (err) {
                    console.log(`Error when verifying: ${err}`);
                }
                if (res.result.n === 0) { 
                    console.log(`Provider ${providerId} tried to present incorrect token ${token}!`);
                } else {
                    successCount += 1;
                }
            })
        });
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