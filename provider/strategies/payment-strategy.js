const fs = require("fs").promises;

const DEFAULT_TOKEN_FILE = "../tokens.txt";

const DEFAULT_PAYMENT_STRATEGY = async ({ token, peerId }) => {
  const data = token + "\n";
  await fs.appendFile(DEFAULT_TOKEN_FILE, data);
};

module.exports = {
  DEFAULT_PAYMENT_STRATEGY,
};
