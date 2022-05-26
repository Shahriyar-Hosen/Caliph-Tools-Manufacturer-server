const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();
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

// Verify JWT Middleware
function verifyJWT(req, res, next) {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ message: "UnAuthorized access" });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}
// =====================================================

// async await function
async function run() {
  
  try {
    await client.connect();

    // All Collection
    const toolCollection = client.db("caliph-tools").collection("tools");
    const reviewCollection = client.db("caliph-tools").collection("reviews");
    const orderCollection = client.db("caliph-tools").collection("orders");
    const userCollection = client.db("caliph-tools").collection("users");
    const paymentCollection = client.db("caliph-tools").collection("payment");

    // ======================================

    //  Verify Admin Middleware
    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requestAccount = await userCollection.findOne({ email: requester });
      if (requestAccount.role === "Admin") {
        next();
      } else {
        return res.status(403).send({ message: "Forbidden access" });
      }
    };
    // =========================================

    //  Verify Not Admin Middleware
    const verifyNotAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requestAccount = await userCollection.findOne({ email: requester });
      if (requestAccount.role !== "Admin") {
        next();
      } else {
        return res.status(403).send({ message: "Forbidden access" });
      }
    };
    // =========================================

    // Payment Intent Api
    app.post("/create-payment-intent", verifyJWT, async (req, res) => {
      const { price } = req.body;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });
    // -----------------------------------------------------------------------------------

    // Get  api to read all tools
    app.get("/tools", async (req, res) => {
      const tools = (await toolCollection.find().toArray()).reverse();
      res.send(tools);
    });
    // -------------------------------------------

    // Get  API to Tools Read by ID
    app.get("/tools/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await toolCollection.findOne(query);
      res.send(result);
    });
    // -------------------------------------------

    // Create tools api in db
    app.post("/tools", verifyJWT, verifyAdmin, async (req, res) => {
      const newTools = req.body;
      const result = await toolCollection.insertOne(newTools);
      res.send(result);
    });
    // --------------------------------------------------------

    //  Update tools data in db
    app.put("/tools/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const updateTool = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: updateTool,
      };
      const result = await toolCollection.updateOne(filter, updateDoc, options);

      res.send(result);
    });
    // -------------------------------------------

    //  Delete tools in db
    app.delete("/tools/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await toolCollection.deleteOne(query);
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
    app.post("/reviews", verifyJWT, verifyNotAdmin, async (req, res) => {
      const newReviews = req.body;
      const result = await reviewCollection.insertOne(newReviews);
      res.send(result);
    });
    // --------------------------------------------------------

    // Get  api to read all orders
    app.get("/orders", verifyJWT, verifyAdmin, async (req, res) => {
      const orders = (await orderCollection.find().toArray()).reverse();
      res.send(orders);
    });
    // -------------------------------------------

    // Get  API to Read by ID
    app.get("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.findOne(query);
      res.send(result);
    });
    // -------------------------------------------

    // Get  API to Read by Email
    app.get("/order/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = (await orderCollection.find(query).toArray()).reverse();
      res.send(result);
    });
    // -------------------------------------------

    // Create orders api in db
    app.post("/payOrders", verifyJWT, async (req, res) => {
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

    //  Update orders data in db
    app.put("/order/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const updateOrders = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: updateOrders,
      };
      const result = await orderCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });
    // -------------------------------------------

    //  Update payment data in db
    app.patch("/orders/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };

      const result = await paymentCollection.insertOne(payment);
      const updatedBooking = await orderCollection.updateOne(
        filter,
        updatedDoc
      );
      res.send(updatedBooking);
    });
    // -------------------------------------------

    //  Delete order in db
    app.delete("/orders/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });
    // -------------------------------------------

    // Get  api to read all users
    app.get("/users", verifyJWT, verifyAdmin, async (req, res) => {
      const users = (await userCollection.find().toArray()).reverse();
      res.send(users);
    });
    // -------------------------------------------

    // Get Admin user search by email
    app.get("/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === "Admin";
      res.send({ admin: isAdmin });
    });

    // Get  API to Read by Email
    app.get("/user/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });
    // -------------------------------------------

    //  Update user data in db
    app.put("/user/:id", verifyJWT,  async (req, res) => {
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
    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);

      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "1d",
        }
      );
      res.send({ result, token });
    });
    // -------------------------------------------

    //  Delete user in db
    app.delete("/user/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
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
