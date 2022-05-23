const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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

    // All Collection
    const toolCollection = client.db("caliph-tools").collection("tools");
    const reviewCollection = client.db("caliph-tools").collection("reviews");
    const orderCollection = client.db("caliph-tools").collection("orders");

    // ======================================

    // Get  api to read all tools
    app.get("/tools", async (req, res) => {
      const tools = (await toolCollection.find().toArray()).reverse();
      res.send(tools);
    });
    // -------------------------------------------

    // Get  API to Tools Read by ID
    app.get("/tools/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await toolCollection.findOne(query);
      res.send(result);
    });
    // -------------------------------------------

    // Get  api to read all reviews
    app.get("/reviews", async (req, res) => {
      const reviews = (await reviewCollection.find().toArray()).reverse();
      res.send(reviews);
    });
    // -------------------------------------------

    // Create orders api in db
    app.post("/orders", async (req, res) => {
      const orders = req.body;
      console.log("New orders adding ", orders);
      const result = await orderCollection.insertOne(orders);
      res.send(result);
    });
    // ---------------------------------------------------
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
