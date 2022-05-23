const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
// ---------------------------

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.66rsk.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// async await function
async function run() {
  // try catch finally
  try {
    await client.connect();
    const toolCollection = client.db("caliph-tools").collection("tools");

    // Get  api to read all tools
    app.get("/tools", async (req, res) => {
      const tools = (await toolCollection.find().toArray()).reverse();
      res.send(tools);
    });
    // -------------------------------------------
  } finally {
  }
}
// call function catch (console dir)
run().catch(console.dir);
// --------------------------------------------

// http://localhost:5000/
app.get("/", (req, res) => {
  res.send("Hello Tools World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
