import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '../../lib/dbMiddleware';
import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  sender: String,
  receiver: String,
  amount: Number,
  txn: String,
  createdAt: Date,
});

const Transaction = mongoose.model('Transaction', transactionSchema);

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { sender, receiver, amount, txn } = req.body;

  if (!sender || !receiver || !amount || !txn) {
    return res.status(400).json({ error: 'All fields are required' });
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
    res.status(500).json({ error: 'Error while saving transaction' });
  }
};

export default connectDb(handler);