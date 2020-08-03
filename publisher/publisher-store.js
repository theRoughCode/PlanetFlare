const credentials = require("./common/credentials");
const MongoClient = require("mongodb").MongoClient;

const TOKEN_COLLECTION = "token";

class PublisherStore {
  constructor() {
    const [dbname, password] = credentials.getCredentialsMongo();
    const uri = `mongodb+srv://pfc:${password}@cluster0.8nmjg.mongodb.net/${dbname}?retryWrites=true&w=majority`;

    this.dbname = dbname;
    this.password = password; 
    this.client = new MongoClient(uri, { useNewUrlParser: true });
  }

  async setup() {
    await this.client.connect();
    this.db = this.client.db(this.dbname);
  }

  async addTokens(tokensBuffer) {
    const mongoDocs = tokensBuffer.map((token, _) => {
      return {
        tokenName: token,
      }
    });
    const collection = this.db.collection(TOKEN_COLLECTION);

    const res = await collection.insertMany(mongoDocs);
    console.log(`Inserted ${res.insertedCount} tokens.`);
    return res;
  }

  async deleteTokens(tokens) {
    const collection = this.db.collection(TOKEN_COLLECTION);

    const res = await collection.deleteMany({
      tokenName: {
        $in: tokens
      }
    });
    return res; 
  }
}

module.exports = PublisherStore;