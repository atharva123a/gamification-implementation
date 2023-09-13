import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const qaSchema = new Schema(
  {
    // userId: {
    //   type: mongoose.Types.ObjectId,
    //   ref: 'user'
    // },
    creator: {
      type: mongoose.Types.ObjectId,
      ref: 'user'
    },
    originalAuthor: {
      profileImg: {
        type: String
      },
      username: {
        type: String
      },
      name: {
        type: String
      }
    },
    postLink: {
      type: String
    },
    postType: {
      type: String,
      enum: ['twitter', 'linkedIn']
    },
    linkedIn: {
      type: String
    },
    twitter: {
      type: [String]
    },
    question: {
      type: String
    },
    saves: {
      type: [String],
      default: []
    },
    topic: {
      type: [String],
      default: []
    },
    description: {
      type: String
    },
    contentCreated: {
      type: [String],
      default: []
    },
    tokensGenerated: {
      type: Number,
      default: 0
    },
    // used for deciding when to show the deducted transactions go below 25
    actualTokensGenerated: {
      type: Number,
      default: 0 // unlike tokens generated, this can go above 25
    },
    //stores userIds of upvoted individuals
    upvotes: {
      type: [String],
      default: []
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    serviceType: {
      type: String,
      default: 'qa'
    },
    comments: {
      type: [
        {
          // userId: {
          //   type: mongoose.Types.ObjectId,
          //   ref: 'user'
          // },
          creator: {
            type: mongoose.Types.ObjectId,
            ref: 'user'
          },
          text: {
            type: String
          },
          upvotes: {
            type: [String]
          },
          saves: {
            type: [String]
          },
          contentCreated: {
            type: [String]
          },
          tokensGenerated: {
            type: Number,
            default: 0
          },
          actualTokensGenerated: {
            type: Number,
            default: 0
          },
          replies: {
            type: [
              {
                // userId: {
                //   type: mongoose.Types.ObjectId,
                //   ref: 'user'
                // },
                creator: {
                  type: mongoose.Types.ObjectId,
                  ref: 'user'
                },
                text: {
                  type: String
                },
                upvotes: {
                  type: [String]
                },
                saves: {
                  type: [String]
                },
                contentCreated: {
                  type: [String]
                },
                tokensGenerated: {
                  type: Number,
                  default: 0
                },
                actualTokensGenerated: {
                  type: Number,
                  default: 0
                }
              }
            ],
            default: []
          }
        }
      ]
    }
  },
  { timestamps: true }
);

const QASchema = mongoose.model('qa', qaSchema);

export = QASchema;
