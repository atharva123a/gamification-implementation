import mongoose from 'mongoose';

const Schema = mongoose.Schema;

// this is like a mini version of the user schema
// we had a lot more parameters in here:
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true
    },
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    sandboxPoints: {
      type: Number,
      default: 0
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    redeemedTokens: {
      type: Number,
      default: 0
    },
    tokenWallet: {
      tokens: {
        type: Number,
        default: 6666
      },
      expiresAt: {
        type: Date,
        default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000)
      }
    }
  },
  {
    timestamps: true
  }
);

const UserSchema = mongoose.model('user', userSchema);

export = UserSchema;
