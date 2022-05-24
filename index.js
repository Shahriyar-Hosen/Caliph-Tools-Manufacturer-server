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
    const userCollection = client.db("caliph-tools").collection("users");

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

    // Create reviews api in db
    app.post("/reviews", async (req, res) => {
      const newReviews = req.body;
      const result = await reviewCollection.insertOne(newReviews);
      res.send(result);
    });
    // --------------------------------------------------------

    // Get  api to read all tools
    app.get("/orders", async (req, res) => {
      const orders = (await orderCollection.find().toArray()).reverse();
      res.send(orders);
    });
    // -------------------------------------------

    // Get  API to Read by Email
    app.get("/orders/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await orderCollection.find(query).toArray();
      res.send(result);
    });
    // -------------------------------------------

    // Create orders api in db
    app.post("/orders", async (req, res) => {
      const orders = req.body;
      const { quantity, orderQuantity, toolsId: id } = orders;
      const newQuantity = quantity - orderQuantity;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: { quantity: newQuantity },
      };
      const result = await toolCollection.updateOne(filter, updateDoc);
      const order = await orderCollection.insertOne(orders);

      res.send(order);
    });
    // ---------------------------------------------------

        //  Delete user in db
        app.delete("/orders/:id", async (req, res) => {
          const id = req.params.id;
          const query = { _id: ObjectId(id) };
          const result = await orderCollection.deleteOne(query);
          res.send(result);
        });
        // -------------------------------------------

    // Get  API to Read by Email
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });
    // -------------------------------------------

    //  Update user data in db
    app.put("/user/:id", async (req, res) => {
      const id = req.params.id;
      const updateUser = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: updateUser,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);

      res.send(result);
    });
    // -------------------------------------------

    //  Update (upsert / insert) user data in db
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      // let token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, {
      //   expiresIn: "1d",
      // });
      res.send({ result });
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
