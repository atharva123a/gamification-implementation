import mongoose from 'mongoose';

const { Schema } = mongoose;

const activitySchema = new Schema(
  {
    reciever: {
      type: mongoose.Types.ObjectId,
      ref: 'user',
      required: true
    },
    sender: {
      type: mongoose.Types.ObjectId,
      ref: 'user'
    },
    pointsType: {
      type: String,
      enum: ['sandbox', 'general'],
      required: true
    },
    pointsCount: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ['credited', 'debited'],
      required: true
    },
    docModel: {
      type: String,
      enum: ['sandboxsocial', 'qa']
    },
    postId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'docModel'
    },
    commentId: {
      type: String
    },
    replyId: {
      type: String
    },
    senderDetails: {
      type: {
        firstName: {
          type: String
        },
        lastName: {
          type: String
        },
        profileImg: {
          type: String
        },
        username: {
          type: String
        }
      }
    },
    recieverDetails: {
      type: {
        firstName: {
          type: String
        },
        lastName: {
          type: String
        },
        profileImg: {
          type: String
        },
        username: {
          type: String
        }
      }
    },
    post: {
      type: String
    },
    comment: {
      type: String
    },
    reply: {
      type: String
    },
    // includes, the type of activity that caused the transaction, such as upvoted question,saved answer, etc
    activityType: {
      type: String,
      enum: [
        'QATRANSACTIONS',
        'HOTTAKETRANSACTIONS',
        'PLATFORMTRANSACTIONS',
        'SOCIALTRANSACTIONS'
      ],
      required: true
    },
    transactionReason: {
      type: String,
      enum: [
        'RECEIVED_UPVOTE',
        'RECEIVED_COMMENT',
        'RECEIVED_SAVE',
        'RECIEVED_CONVERT_TO_CONTENT',
        'TWITTER_POST',
        'LINKEDIN_POST',
        'BLOG',
        'STREAK_5',
        'RECEIVED_REPLY',
        'DELETED_COMMENT',
        'DELETED_REPLY'
        // more will be added:
      ]
    }
  },
  { timestamps: true }
);

const ActivitySchema = mongoose.model('activity', activitySchema);

export = ActivitySchema;
