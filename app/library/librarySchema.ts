import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const librarySchema = new Schema(
  {
    thoughtId: {
      type: mongoose.Types.ObjectId,
      ref: 'thought'
    },
    docModel: {
      type: String,
      enum: ['sandboxsocial', 'qa']
    },
    contentId: {
      type: Schema.Types.ObjectId,
      // required: true,
      refPath: 'docModel'
    },
    commentId: {
      type: String
    },
    replyId: {
      type: String
    },
    title: {
      type: String
    },
    link: {
      type: String
    },
    twitterUsername: {
      type: String
    },
    tag: {
      type: String,
      default: '#journal'
    },
    message: {
      type: String
    },
    postType: {
      type: String
    },
    libraryType: {
      type: String,
      enum: ['summary', 'thought']
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    tweetId: {
      type: String
    },
    isFollowedUser: {
      type: Boolean,
      default: false
    },
    twitterUserId: {
      type: String
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: 'user',
      required: true
    },
    updatedBy: {
      type: mongoose.Types.ObjectId,
      ref: 'user',
      required: true
    }
  },
  {
    timestamps: true
  }
);

const LibrarySchema = mongoose.model('library', librarySchema);

export = LibrarySchema;
