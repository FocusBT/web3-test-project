const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://focus123:Memon4231@cluster0.66jjnzy.mongodb.net/?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB", err);
  });

// Define MongoDB schema and model
const transactionSchema = new mongoose.Schema({
  sender: String,
  receiver: String,
  amount: mongoose.Decimal128,
  txn: String,
  createdAt: Date,
});

const Transaction = mongoose.model("Transaction", transactionSchema);

// Define API endpoints
app.post("/api/saveTransaction", async (req, res) => {
  const { sender, receiver, amount, txn } = req.body;

  if (!sender || !receiver || !amount || !txn) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const result = await Transaction.create({
      sender,
      receiver,
      amount,
      txn,
      createdAt: new Date(),
    });

    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error while saving transaction" });
  }
});

// Listen
const port = 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
