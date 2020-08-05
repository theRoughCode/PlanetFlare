const fs = require("fs").promises;
const path = require('path');

const DEFAULT_TOKEN_FILE = path.join(__dirname, "../tokens.txt");

const DEFAULT_PAYMENT_STRATEGY = async ({ token, peerId }) => {
  const data = token + "\n";
  await fs.appendFile(DEFAULT_TOKEN_FILE, data);
};

const TEST_PAYMENT_STRATEGY = async ({ token, peerId }) => {
  console.log("Test payment strategy", token, peerId);
};

const PAYMENT_STRATEGIES = {
  "DEFAULT": DEFAULT_PAYMENT_STRATEGY,
  "TEST": TEST_PAYMENT_STRATEGY,
};

module.exports = {
  DEFAULT_PAYMENT_STRATEGY,
  PAYMENT_STRATEGIES,
};
