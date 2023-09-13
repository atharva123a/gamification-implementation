import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const sandBoxSocialSchema = new Schema(
  {
    // userId: {
    //   type: mongoose.Types.ObjectId,
    //   ref: 'user'
    // },
    topic: {
      type: [String]
    },
    creator: {
      type: mongoose.Types.ObjectId,
      ref: 'user'
    },
    // this is optional and given only in case the user paste's some link from sandbox:
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
    serviceType: {
      type: String,
      default: 'social'
    },
    postLink: {
      type: String
    },
    author: {
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
    saves: {
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
    comments: {
      type: [
        {
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

const SandBoxSocial = mongoose.model('sandboxsocial', sandBoxSocialSchema);

export = SandBoxSocial;
