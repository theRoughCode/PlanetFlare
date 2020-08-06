"use strict";
global.WebSocket = require("isomorphic-ws");

const express = require("express");
const uuid = require("uuid");
const cors = require("cors");
const upload = require("./common/upload");
const PlanetFlarePublisher = require("./planetflare-publisher");
const PublisherStore = require("./publisher-store");
const BucketHandler = require("./bucket-handler");
const utils = require('./common/utils');
const PORT = 3001;

let node;
let publisherStore;

const web3 = require("./ethereum").getWeb3Instance();
const account = require("./ethereum").getUnlockedAccount(web3);
const PlanetFlareContract = require("./ethereum").getPlanetFlareContract(web3);
const PaymentManager = require("./payment-manager");
const { Database } = require("@textile/hub");
const paymentManager = new PaymentManager(web3, account);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/contractABI", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.json({
    abi: require("./ethereum").getPlanetFlareABI(),
    address: require("./ethereum").getContractAddress(),
  });
});

/**
 * Generate tokens for clients requesting them [GET].
 * Param: num (query string)
 */
app.get("/get_tokens", (req, res) => {
  const numTokens = req.query.num;

  if (!numTokens) {
    res.status(400).json({ error: "numTokens parameter invalid" });
  }

  const tokensBuffer = [];
  console.log(`Received request to fetch ${numTokens} tokens.`);

  for (let i = 0; i < numTokens; ++i) {
    tokensBuffer.push(uuid.v4());
  }

  publisherStore.addTokens(tokensBuffer);
  console.log("Returning", tokensBuffer);
  res.json({ tokens: tokensBuffer });
});

/**
 * Pay providers presenting clients' proofs-of-receipt [POST].
 * Params: tokens, bountyID, recipientAddress (body)
 */
app.post("/verify_payment", async (req, res) => {
  const tokens = req.body.tokens;
  let bountyID = req.body.bountyID;
  const recipientAddress = req.body.recipientAddress;

  if (!tokens) {
    res.status(400).json({ error: "No tokens provided" });
    return;
  }

  if (!recipientAddress) {
    res.status(400).json({ error: "No recipient address" });
    return;
  }

  if (!bountyID) {
    const bucketID = req.body.bucketID;
    if (!bucketID) {
      res.status(400).json({ error: "No bounty ID" });
      return;
    } else {
      bountyID = utils.bucketIDToBountyID(web3, account.address, bucketID);
      console.log(`converted bucketID ${bucketID} to ${bountyID}`);
    }
  }

  let futurePayment = req.body.futurePayment;

  try {
    if (futurePayment) {
      if (!paymentManager.verifyFuturePayment(futurePayment)) {
        res.status(401).json({ error: "Invalid future payment" });
        return;
      }
    } else {
      // TODO: optional, verify that the given bounty ID exists before continuing
      futurePayment = paymentManager.createFuturePayment(
        recipientAddress,
        bountyID
      );
    }

    console.log(`tokens: ${tokens}`);
    const result = await publisherStore.deleteTokens(tokens);
    futurePayment = paymentManager.incrementFuturePayment(
      futurePayment,
      result.result.n
    );
    console.log("future payment", futurePayment);
    res.json(futurePayment);
  } catch (error) {
    console.error(error);
    res.status(500);
    res.send(error);
    return;
  }
});

app.listen(PORT, () => {
  console.log(`Publisher listening on port ${PORT}`);
});

app.post("/upload", async (req, res) => {
  const files = req.body.files;
  const { _, bucketKey } = await node.bucketHandler.getOrInit("bucket1");
  await node.bucketHandler.upsertFiles("bucket1", files);

  res.json({ bucketId: bucketKey });
});

const init = async () => {
  node = new PlanetFlarePublisher();
  publisherStore = new PublisherStore();
  await node.start();
  await publisherStore.setup();
  await console.log("done init!");
};

init();

/**
 * Random error catching
 */
process.on("uncaughtException", (err) => {
  console.log(err);
});
