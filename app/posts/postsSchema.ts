import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const postsSchema = new Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: 'user'
    },
    channel: {
      type: String,
      emum: ['twitter', 'linkedIn', 'sandbox', 'blog', 'brainstorm']
    },
    isScheduled: {
      type: Boolean,
      default: false
    },
    text: {
      type: [String]
    },
    //   twitter:{
    //     data: [
    //       {
    //         tweetId: {
    //           type: String
    //         },
    //         prevTweetId: {
    //           type: String
    //         },
    //         isThread: {
    //           type: Boolean,
    //           default: false
    //         },
    //         threadId: {
    //           type: String // uuid attached to and unique for every thread
    //         },
    //         threadIndex: {
    //           type: Number
    //         },
    //         content: {
    //           type: String
    //         }
    // }]
    //     // twitter's unique Id:
    //   },
    status: {
      type: String,
      enum: ['success', 'failed']
    },
    failureReason: {
      type: String
    },
    state: {
      type: String
    },
    scheduledAt: {
      type: Date
    },
    natureOfPost: {
      type: String,
      enum: ['scheduled', 'ai-generated', 'posted']
    },
    asset: {
      type: String
    },
    linkedInImageUrl: {
      type: String
    },
    createdAt: {
      type: Date
    },
    updatedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

const PostsSchema = mongoose.model('post', postsSchema);

export = PostsSchema;
