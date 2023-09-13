import QASchema from '../qa/qaSchema';
import SandBoxSocial from '../sandboxSocial/sandboxSocialSchema';
import UserSchema from '../user/userSchema';
import createAPIError from '../utils/error';
import logger from '../utils/logger';
import ActivitySchema from './activitySchema';
import { sortedPagination } from '../utils/helper';
import { Response } from 'express';

const handlePoints = async ({
  pointsType,
  senderId,
  activityType,
  transactionReason,
  pointsCount,
  type,
  recieverId,
  postId,
  docModel,
  commentId = '',
  replyId = '',
  post = '',
  comment = '',
  reply = ''
}) => {
  try {
    const sender = senderId;
    const reciever = recieverId;

    if (type == 'credited') {
      const senderDetails = await UserSchema.findById(senderId);
      const recieverDetails = await UserSchema.findById(recieverId);

      const activity = await ActivitySchema.create({
        pointsCount,
        pointsType,
        sender: senderId,
        activityType,
        transactionReason,
        type,
        docModel,
        reciever: recieverId,
        senderDetails,
        recieverDetails,
        postId,
        commentId,
        replyId,
        post,
        comment,
        reply
      });

      return { success: true, points: pointsCount };
    }
    deleteActivity(
      postId,
      sender,
      reciever,
      commentId,
      replyId,
      transactionReason
    );

    return { success: true };
  } catch (error) {
    let err = error.message || error;
    logger.error(err);
    return { success: true, message: err };
  }
};

const deleteActivity = async (
  postId,
  sender,
  reciever,
  commentId,
  replyId,
  transactionReason
) => {
  await ActivitySchema.findOneAndDelete({
    postId,
    commentId,
    replyId,
    reciever,
    sender,
    transactionReason
  });
};

const deletePostActivity = async (postId) => {
  await ActivitySchema.deleteMany({ postId });

  return { success: true, message: 'deleted successfully!' };
};

const deleteCommentActivity = async (postId, commentId) => {
  await ActivitySchema.deleteMany({ postId, commentId });

  return { success: true, message: 'deleted successfully!' };
};

const deleteReplyActivity = async (
  postId,
  commentId,
  replyId,
  sender,
  transactionReason
) => {
  await ActivitySchema.deleteMany({ postId, commentId, replyId });

  await ActivitySchema.findOneAndDelete({
    postId,
    commentId,
    sender,
    transactionReason
  });
  return { success: true, message: 'deleted successfully!' };
};

const getUserActivity = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    let { page, limit } = req.query;

    if (!page) page = 1;
    if (!limit) limit = 10;

    page = parseInt(page);
    limit = parseInt(limit);

    const query = { sender: userId };
    const sortBy = { updatedAt: -1 };

    const { success, data, message } = await sortedPagination({
      model: ActivitySchema,
      query,
      page,
      limit,
      sortBy
    });

    if (!success) {
      return createAPIError(500, message, res);
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    let err = error.message || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const getActivityRecieved = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    const activity = await ActivitySchema.find({
      reciever: userId
    }).sort({ updatedAt: -1 });

    return res.status(200).json({ success: true, data: activity });
  } catch (error) {
    let err = error.message || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const getCreatedContent = async (req, res: Response) => {
  try {
    const userId = req.user.id;

    let sandBoxData = await SandBoxSocial.find({
      creator: userId,
      isDeleted: false
    })
      .sort({ createdAt: -1 })
      .populate('creator', 'username firstName lastName profileImg')
      .populate(
        'comments.creator',
        '_id username profileImg firstName lastName'
      )
      .populate(
        'comments.replies.creator',
        '_id username profileImg firstName lastName'
      );

    let questions = await QASchema.find({
      creator: userId,
      isDeleted: false
    })
      .sort({ createdAt: -1 })
      .populate('creator', 'username firstName lastName profileImg')
      .populate(
        'comments.creator',
        '_id username profileImg firstName lastName'
      )
      .populate(
        'comments.replies.creator',
        '_id username profileImg firstName lastName'
      );

    const data = [...sandBoxData, ...questions];

    return res.status(200).json({ success: true, data });
  } catch (error) {
    let err = error.message || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const getPublicContent = async (req, res: Response) => {
  try {
    const username = req.query.username;
    const user = await UserSchema.findOne({ username: username });

    if (!user) {
      return createAPIError(
        404,
        `No user found with username: ${username}`,
        res
      );
    }

    const userId = user._id;

    let sandBoxData = await SandBoxSocial.find({
      creator: userId,
      isDeleted: false
    })
      .sort({ createdAt: -1 })
      .populate('creator', '_id username profileImg firstName lastName');

    let questions = await QASchema.find({
      creator: userId,
      isDeleted: false
    })
      .sort({ createdAt: -1 })
      .populate('creator', '_id username profileImg firstName lastName');

    const data = [...sandBoxData, ...questions];

    return res.status(200).json({ success: true, data });
  } catch (error) {
    let err = error.message || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

export = {
  handlePoints,
  deleteActivity,
  deleteCommentActivity,
  deletePostActivity,
  deleteReplyActivity,
  getActivityRecieved,
  getUserActivity,
  getCreatedContent,
  getPublicContent
};
