import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const tokenTransactionSchema = new Schema(
  {
    transactionType: {
      type: String,
      enum: ['credit', 'debit'],
      required: true
    },
    tokens: {
      type: Number,
      required: true
    },
    //   source module for this transaction ideally razorPayID?:
    source: {
      type: String
    },
    expiresAt: {
      type: Date
    },
    userId: {
      type: mongoose.Types.ObjectId,
      ref: 'user'
    },
    updatedWallet: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

const TokenTransactionSchema = mongoose.model(
  'tokenTransaction',
  tokenTransactionSchema
);

export = TokenTransactionSchema;
