import { Request, Response } from 'express';
import createAPIError from '../utils/error';
import logger from '../utils/logger';
import SandBoxSocial from './sandboxSocialSchema';
import UserSchema from '../user/userSchema';

import {
  SOCIALTRANSACTIONS,
  SANDBOX_CONSTANTS,
  DROPDOWN,
  SandboxTopics
} from '../constants';
import ActivityService from '../activity/activityService';
import UserService from '../user/userService';
import LibrarySchema from '../library/librarySchema';
import TokenTransactionSchema from '../tokenTransaction/tokenTransactionSchema';
import PostsSchema from '../posts/postsSchema';

const REASON = { upvotes: 'upvote', contentCreated: 'content', saves: 'save' };

const getAllPosts = async (req: any, res: Response) => {
  try {
    const { topic } = req.query;

    let { page, limit } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    if (!page) page = 1;
    if (!limit) limit = 10;

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    let query;

    if (!topic || topic.length == 0) query = { isDeleted: false };
    else query = { isDeleted: false, topic: topic };

    const results = {};
    // next page:
    if (endIndex < (await SandBoxSocial.countDocuments(query).exec())) {
      results['next'] = {
        page: page + 1,
        limit
      };
    }
    // previous page:
    if (startIndex > 0) {
      results['prev'] = {
        page: page - 1,
        limit: limit
      };
    }

    // if (!topic || topic.length == 0) {
    //   posts = await SandBoxSocial.find({
    //     isDeleted: false
    //   }).sort({ createdAt: -1 }).populate('creator', 'username profileImg')
    //     .populate('comments.creator', 'username profileImg')
    //     .populate('comments.replies.creator', 'username profileImg');
    // } else
    //   posts = await SandBoxSocial.find({ isDeleted: false, topic }).sort({
    //     createdAt: -1
    //   }).populate('creator', 'username profileImg')
    //     .populate('comments.creator', 'username profileImg')
    //     .populate('comments.replies.creator', 'username profileImg');

    let posts: any = await SandBoxSocial.find(query)
      .limit(limit)
      .skip(startIndex)
      .populate('creator', '_id username profileImg firstName lastName')
      .populate(
        'comments.creator',
        '_id username profileImg firstName lastName'
      )
      .populate(
        'comments.replies.creator',
        '_id username profileImg firstName lastName'
      )
      .sort({ createdAt: -1 })
      .exec();

    // posts.map((post) => {
    //   let updatedComments = post.comments.map((comment) => {
    // comment.replies = comment.replies.reverse();

    //     return comment;
    //   });

    //   post.comments = updatedComments.reverse();

    //   return post;
    // });

    return res.status(200).json({
      success: true,
      data: posts,
      prev: results['prev'],
      next: results['next']
    });
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const getSinglePost = async (req: any, res: Response) => {
  try {
    const postId = req.params.id;
    const post = await SandBoxSocial.findById(postId)
      .populate('creator', ' _id username profileImg firstName lastName')
      .populate(
        'comments.creator',
        '_id username profileImg firstName lastName'
      )
      .populate(
        'comments.replies.creator',
        '_id username profileImg firstName lastName'
      );

    if (!post || post.isDeleted) {
      return createAPIError(404, `No post found!`, res);
    }

    return res.status(200).json({ success: true, data: post });
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const createPost = async (req: any, res: Response) => {
  try {
    let { postType, post, description, topic } = req.body;
    const userId = req.user.id;

    const user: any = await UserSchema.findById(userId);

    if (!user || user.isDeleted) {
      return createAPIError(404, `No such user found!`, res);
    }

    if (!postType || !post) {
      return createAPIError(400, `Please specify postType and post!`, res);
    }

    let twitter, linkedIn;

    if (postType.toLowerCase() == 'twitter') {
      if (typeof post != 'object') {
        return createAPIError(
          400,
          `Please specify twitter post in the form of an array!`,
          res
        );
      }
      twitter = post;
      linkedIn = '';
    } else if (postType.toLowerCase() == 'linkedin') {
      if (typeof post != 'string') {
        return createAPIError(
          400,
          `Please specify linkedIn post in the form of a string!`,
          res
        );
      }
      linkedIn = post;
      twitter = [];
    } else return createAPIError(400, `Invalid post type!`, res);

    let data = await SandBoxSocial.create({
      creator: userId,
      postType,
      linkedIn,
      twitter,
      description,
      topic
    });
    if (!user.missions.firstDiscussionOnSandbox) {
      user.missions.firstDiscussionOnSandbox = true;
      user.sandboxPoints = user.sandboxPoints + 3;
      await user.save();
    }

    const final = await SandBoxSocial.findById(data._id)
      .populate('creator', ' _id username profileImg firstName lastName')
      .populate(
        'comments.creator',
        '_id username profileImg firstName lastName'
      )
      .populate(
        'comments.replies.creator',
        '_id username profileImg firstName lastName'
      );

    await PostsSchema.create({
      userId,
      text: final,
      channel: 'sandbox',
      natureOfPost: 'posted'
    });

    return res.status(200).json({ success: true, data: final });
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const updatePost = async (req: any, res: Response) => {
  try {
    const postId = req.params.id;
    const post: any = await checkIfPostExists(postId, res);

    if (post.creator.toString() !== req.user.id) {
      return createAPIError(401, `Unauthorized to access route!`, res);
    }

    let { post: updatedPost, topic } = req.body;

    if (!updatedPost) {
      return createAPIError(400, `Please specify the update!`, res);
    }

    if (post.postType.toLowerCase() == 'twitter') {
      if (typeof updatedPost != 'object') {
        return createAPIError(
          400,
          `Please specify twitter post in the form of an array!`,
          res
        );
      }
      post.twitter = updatedPost;
    } else if (post.postType.toLowerCase() == 'linkedin') {
      if (typeof updatedPost != 'string') {
        return createAPIError(
          400,
          `Please specify linkedIn post in the form of a string!`,
          res
        );
      }
      post.linkedIn = updatedPost;
    }

    post.topic = topic;
    await post.save();

    let newPost = await SandBoxSocial.findById(postId)
      .populate('creator', '_id username profileImg firstName lastName')
      .populate(
        'comments.creator',
        '_id username profileImg firstName lastName'
      )
      .populate(
        'comments.replies.creator',
        '_id username profileImg firstName lastName'
      );

    return res.status(200).json({ success: true, data: newPost });
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const deletePost = async (req: any, res: Response) => {
  try {
    const postId = req.params.id;

    const post: any = await checkIfPostExists(postId, res);

    const user = await UserSchema.findById(post.creator);

    if (post.creator.toString() !== req.user.id && !user.isAdmin) {
      return createAPIError(401, `Unauthorized to access route!`, res);
    }

    user.sandboxPoints -= post.tokensGenerated;
    await user.save();

    post.isDeleted = true;

    await post.save();

    ActivityService.deletePostActivity(postId);

    return res
      .status(200)
      .json({ success: true, message: 'Deleted post successfully!' });
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const handlePointsForPost = (
  sender,
  reciever,
  reason,
  credit,
  post,
  res: Response
) => {
  const postId = post._id;

  if (sender.toString() != reciever.toString()) {
    if (credit) {
      if (
        post.tokensGenerated + SOCIALTRANSACTIONS[SANDBOX_CONSTANTS[reason]] <=
        25
      ) {
        post.tokensGenerated += SOCIALTRANSACTIONS[SANDBOX_CONSTANTS[reason]];
      }
      post.actualTokensGenerated +=
        SOCIALTRANSACTIONS[SANDBOX_CONSTANTS[reason]];
    } else {
      if (
        post.actualTokensGenerated -
          SOCIALTRANSACTIONS[SANDBOX_CONSTANTS[reason]] <
        25
      ) {
        post.tokensGenerated -= SOCIALTRANSACTIONS[SANDBOX_CONSTANTS[reason]];
      }
      post.actualTokensGenerated -=
        SOCIALTRANSACTIONS[SANDBOX_CONSTANTS[reason]];
    }
    let postData;
    if (post.postType == 'twitter') {
      postData = post.twitter[0];
    } else postData = post.linkedIn;

    // here credit true/false handles for the type of transaction:
    handleTransactions({
      sender: sender.toString(),
      reciever: reciever.toString(),
      add: credit, // credit
      reason,
      res,
      postId,
      post: postData
    });
  }

  return post;
};

const updatePostById = (post, userId, type, credit, res: Response) => {
  let types = post[`${type}`].filter((item) => item == userId.toString());

  if (credit) {
    // can't save/upvote/createContent if already done:
    if (types.length > 0) {
      return { success: false, code: 1 };
    }

    post[`${type}`].push(userId.toString());
  } else {
    // can't downvote or unsave if already done:
    if (types.length == 0) {
      return { success: false, code: 1 };
    }

    post[`${type}`] = post[`${type}`].filter(
      (item) => item != userId.toString()
    );
  }

  let reason = REASON[type];

  // we are not awaiting for transactions entry to be created:
  post = handlePointsForPost(userId, post.creator, reason, credit, post, res);

  return { success: true, data: post };

  // let types = post[`${type}`].filter((save) => save != userId.toString());

  // if (credit) {
  //   // can't save/upvote/createContent if already done:
  //   if (types.length != post[`${type}`].length) {
  //     return { success: false, code: 1 };
  //   }

  //   types.push(userId);

  //   post[`${type}`] = types;
  // } else {
  //   // can't downvote or unsave if already done:
  //   if (types.length == post[`${type}`].length) {
  //     return { success: false, code: 1 };
  //   }

  //   post[`${type}`] = types;
  // }

  // let reason = REASON[type];

  // // we are not awaiting for transactions entry to be created:
  // post = handlePointsForPost(userId, post.creator, reason, credit, post, res);

  // return { success: true, data: post };
};

const savePost = async (req: any, res: Response) => {
  try {
    const postId = req.params.id;

    const userId = req.user.id;

    const post: any = await checkIfPostExists(postId, res);

    let type = 'saves';

    let {
      data: updatedPost,
      success,
      code
    } = updatePostById(post, userId, type, true, res);

    if (!success) {
      return createAPIError(400, `Already saved!`, res);
    }

    await updatedPost.save();

    const data: any = await SandBoxSocial.findById(postId)
      .populate('creator', '_id username profileImg firstName lastName')
      .populate(
        'comments.creator',
        '_id username profileImg firstName lastName'
      )
      .populate(
        'comments.replies.creator',
        '_id username profileImg firstName lastName'
      );

    // type: String
    // type: String
    await LibrarySchema.create({
      docModel: 'sandboxsocial',
      message: updatedPost.topic,
      contentId: postId.toString().trim(),
      createdBy: userId,
      updatedBy: userId,
      tag: '#sandbox',
      postType: 'post'
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const unsavePost = async (req: any, res: Response) => {
  try {
    const postId = req.params.id;

    const userId = req.user.id;

    const post: any = await checkIfPostExists(postId, res);

    let type = 'saves';

    let {
      data: updatedPost,
      success,
      code
      // here false is the only change!
    } = updatePostById(post, userId, type, false, res);

    if (!success) {
      return createAPIError(400, `Already unsaved!`, res);
    }

    await updatedPost.save();

    const data: any = await SandBoxSocial.findById(postId)
      .populate('creator', '_id username profileImg firstName lastName')
      .populate(
        'comments.creator',
        '_id username profileImg firstName lastName'
      )
      .populate(
        'comments.replies.creator',
        '_id username profileImg firstName lastName'
      );

    await LibrarySchema.findOneAndDelete({
      contentId: postId,
      createdBy: userId
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const upvotePost = async (req: any, res: Response) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const post: any = await checkIfPostExists(postId, res);

    let type = 'upvotes';

    let {
      data: updatedPost,
      success,
      code
    } = updatePostById(post, userId, type, true, res);

    if (!success) {
      return createAPIError(400, `Already upvoted!`, res);
    }

    await updatedPost.save();

    const data: any = await SandBoxSocial.findById(postId)
      .populate('creator', '_id username profileImg firstName lastName')
      .populate(
        'comments.creator',
        '_id username profileImg firstName lastName'
      )
      .populate(
        'comments.replies.creator',
        '_id username profileImg firstName lastName'
      );

    return res.status(200).json({ success: true, data });
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const removeUpvote = async (req: any, res: Response) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const post: any = await checkIfPostExists(postId, res);

    let type = 'upvotes';

    let {
      data: updatedPost,
      success,
      code
      // false means a debit:
    } = updatePostById(post, userId, type, false, res);

    if (!success) {
      return createAPIError(400, `Already removed upvote!`, res);
    }

    await updatedPost.save();

    const data: any = await SandBoxSocial.findById(postId)
      .populate('creator', '_id username profileImg firstName lastName')
      .populate(
        'comments.creator',
        '_id username profileImg firstName lastName'
      )
      .populate(
        'comments.replies.creator',
        '_id username profileImg firstName lastName'
      );

    return res.status(200).json({ success: true, data });
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const createComment = async (req: any, res: Response) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const { text } = req.body;

    if (!text) {
      return createAPIError(400, `Please provide comment`, res);
    }

    const user = await UserSchema.findById(userId);

    const post: any = await checkIfPostExists(postId, res);

    const comment = {
      creator: userId,
      text
    };

    post.comments.push(comment);

    let reason = 'comment';
    let updatedPost = handlePointsForPost(
      userId,
      post.creator,
      reason,
      true,
      post,
      res
    );

    await updatedPost.save();

    const data: any = await SandBoxSocial.findById(postId)
      .populate('creator', '_id username profileImg firstName lastName')
      .populate(
        'comments.creator',
        '_id username profileImg firstName lastName'
      )
      .populate(
        'comments.replies.creator',
        '_id username profileImg firstName lastName'
      );

    return res.status(200).json({ success: true, data });
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const updateComment = async (req: any, res: Response) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const { text, commentId } = req.body;

    if (!text || !commentId) {
      return createAPIError(400, `Please provide text and commentId`, res);
    }

    const post: any = await checkIfPostExists(postId, res);

    let updated = false;

    let unfairUpdation = false;

    let updatedComments = post.comments.map((comment) => {
      if (comment._id == commentId) {
        if (comment.creator.toString() !== userId.toString()) {
          unfairUpdation = true;
        } else {
          comment.text = text;
          updated = true;
        }
      }
      return comment;
    });

    if (updated) {
      post.comments = updatedComments;
      await post.save();
    } else {
      if (unfairUpdation) {
        return createAPIError(400, `Can't edit someone else's comment!`, res);
      }
      return createAPIError(400, `No such comment found!`, res);
    }
    const data: any = await SandBoxSocial.findById(postId)
      .populate('creator', '_id username profileImg firstName lastName')
      .populate(
        'comments.creator',
        '_id username profileImg firstName lastName'
      )
      .populate(
        'comments.replies.creator',
        '_id username profileImg firstName lastName'
      );

    return res.status(200).json({ success: true, data });
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const deleteComment = async (req: any, res: Response) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const { commentId } = req.body;

    if (!commentId) {
      return createAPIError(400, `Please provide commentId`, res);
    }

    const post: any = await checkIfPostExists(postId, res);

    let comments = [];

    let commentPoints = 0;

    const user = await UserSchema.findById(userId);

    for (let i = 0; i < post.comments.length; ++i) {
      if (post.comments[i]._id == commentId) {
        if (post.comments[i].creator != userId && !user.isAdmin) {
          i = post.comments.length;
          return createAPIError(
            400,
            `Can't delete someone else's comment`,
            res
          );
        }
        commentPoints = post.comments[i].tokensGenerated;
      } else {
        comments.push(post.comments[i]);
      }
    }

    post.comments = comments;

    let reason = 'comment';
    let updatedPost = handlePointsForPost(
      userId,
      post.creator,
      reason,
      false,
      post,
      res
    );

    await updatedPost.save();

    const data: any = await SandBoxSocial.findById(postId)
      .populate('creator', '_id username profileImg firstName lastName')
      .populate(
        'comments.creator',
        '_id username profileImg firstName lastName'
      )
      .populate(
        'comments.replies.creator',
        '_id username profileImg firstName lastName'
      );

    // const user = await UserSchema.findById(userId);

    user.sandboxPoints -= commentPoints;
    user.save();

    ActivityService.deleteCommentActivity(postId, commentId);

    return res
      .status(200)
      .json({ success: true, message: 'Deleted successfully!' });
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const checkIfPostExists = async (postId, res) => {
  const post = await SandBoxSocial.findById(postId);

  if (!post || post.isDeleted) {
    return createAPIError(404, `No post found!`, res);
  }
  return post;
};

const createContentFromPost = async (req: any, res: Response) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const post: any = await checkIfPostExists(postId, res);

    let type = 'contentCreated';

    let {
      data: updatedPost,
      success,
      code
    } = updatePostById(post, userId, type, true, res);

    if (!success) {
      return createAPIError(400, `Already created content!`, res);
    }

    await updatedPost.save();

    const data: any = await SandBoxSocial.findById(postId)
      .populate('creator', '_id username profileImg firstName lastName')
      .populate(
        'comments.creator',
        '_id username profileImg firstName lastName'
      )
      .populate(
        'comments.replies.creator',
        '_id username profileImg firstName lastName'
      );

    return res.status(200).json({ success: true, data });
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const handleTransactions = async ({
  sender,
  reciever,
  add,
  reason,
  res,
  postId,
  commentId = '',
  replyId = '',
  post = '',
  comment = '',
  reply = ''
}) => {
  const type = add == true ? 'credited' : 'debited';

  const activityType = SANDBOX_CONSTANTS['social'];
  const transactionReason = SANDBOX_CONSTANTS[reason];
  const pointsCount = SOCIALTRANSACTIONS[SANDBOX_CONSTANTS[reason]];
  const { success, message } = await ActivityService.handlePoints({
    pointsType: 'sandbox',
    senderId: sender,
    activityType,
    pointsCount,
    transactionReason,
    type,
    recieverId: reciever,
    postId,
    docModel: 'sandboxsocial',
    commentId,
    replyId,
    post,
    comment,
    reply
  });

  UserService.updatePoints(reciever.toString(), add, pointsCount);

  if (!success) {
    return createAPIError(500, message, res);
  }
};

const getCreatedPosts = async (req: any, res: Response) => {
  try {
    const userId = req.params.userId;

    const user = await UserSchema.findById(userId);

    if (!user) {
      return createAPIError(404, `No user found!`, res);
    }
    const posts = await SandBoxSocial.find({
      creator: userId,
      isDeleted: false
    }).sort({ createdAt: -1 });
    // const posts = await SandBoxSocial.find({
    //   creator: { userId: userId.toString() }
    // });

    return res.status(200).json({ success: true, data: posts });
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const handlePointsForComments = async (
  userId,
  comment,
  reason, // upvote, save or comment
  credit,
  res,
  postId,
  commentId,
  replyId = ''
) => {
  userId = userId.toString();
  // const commentId = comment._id;
  let commentText = comment.text;
  let reply;
  if (replyId.length > 0) {
    reply = commentText;
    commentText = '';
  }

  //   create a transaction here if the person who created it is not the person who wrote the post:
  if (credit) {
    if (
      userId != comment.creator.toString() &&
      comment.tokensGenerated + SOCIALTRANSACTIONS[SANDBOX_CONSTANTS[reason]] <=
        25
    ) {
      handleTransactions({
        sender: userId.toString(),
        reciever: comment.creator.toString(),
        add: true,
        reason,
        res,
        postId,
        commentId,
        replyId,
        comment: commentText,
        reply
      });
      comment.tokensGenerated += SOCIALTRANSACTIONS[SANDBOX_CONSTANTS[reason]];
    }
    if (userId != comment.creator.toString()) {
      comment.actualTokensGenerated +=
        SOCIALTRANSACTIONS[SANDBOX_CONSTANTS[reason]];
    }
  } else {
    if (
      userId != comment.creator.toString() &&
      comment.actualTokensGenerated -
        SOCIALTRANSACTIONS[SANDBOX_CONSTANTS[reason]] <
        25
    ) {
      handleTransactions({
        sender: userId.toString(),
        reciever: comment.creator.toString(),
        add: false,
        reason,
        res,
        postId,
        commentId,
        replyId,
        comment: commentText,
        reply
      });
      comment.tokensGenerated -= SOCIALTRANSACTIONS[SANDBOX_CONSTANTS[reason]];
    }
    if (userId.toString() != comment.creator.toString()) {
      comment.actualTokensGenerated -=
        SOCIALTRANSACTIONS[SANDBOX_CONSTANTS[reason]];
    }
  }

  return comment;
};

const updateCommentById = async (
  post: any,
  commentId,
  userId,
  type,
  res: Response,
  debit = false
) => {
  const comments = post.comments;

  let comment = comments.filter(
    (comment) => comment['_id'].toString() == commentId
  );

  if (!comment || comment.length == 0) {
    return { success: false, code: 1, message: 'No comment found!' };
  }

  comment = comment[0];

  const types = comment[`${type}`].filter((item) => item == userId);

  if (debit) {
    if (types.length == 0) {
      return { success: false, code: 2 };
    }

    if (types.length > 0) {
      comment[`${type}`] = comment[`${type}`].filter((item) => item != userId);
    }
  } else {
    if (types.length > 0) {
      return { success: false, code: 2 };
    }

    if (types.length == 0) {
      comment[`${type}`].push(userId);
    }
  }

  let reason = '';
  if (type == 'upvotes') reason = 'upvote';
  if (type == 'contentCreated') reason = 'content';
  if (type == 'saves') reason = 'save';

  const postId = post._id;

  comment = await handlePointsForComments(
    userId,
    comment,
    reason,
    !debit,
    res,
    postId,
    commentId
  );

  let updatedComments = comments.map((item) => {
    if (item._id.toString() == commentId.toString()) {
      return comment;
    }
    return item;
  });

  return { success: true, data: updatedComments, comment };
};

const upvoteComment = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    const { commentId } = req.body;

    if (!commentId) {
      return createAPIError(400, `Please specify commentId`, res);
    }

    const postId = req.params.id;

    const post: any = await checkIfPostExists(postId, res);

    const { success, code, data } = await updateCommentById(
      post,
      commentId,
      userId,
      'upvotes',
      res
    );

    if (!success) {
      if (code == 1) {
        return createAPIError(404, `No comment found!`, res);
      }

      if (code == 2) {
        return createAPIError(404, `Already upvoted!`, res);
      }
    }

    post.comments = data;

    await post.save();

    const final: any = await SandBoxSocial.findById(postId)
      .populate('creator', '_id username profileImg firstName lastName')
      .populate(
        'comments.creator',
        '_id username profileImg firstName lastName'
      )
      .populate(
        'comments.replies.creator',
        '_id username profileImg firstName lastName'
      );

    return res.status(200).json({ success: true, data: final });
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const saveComment = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    const { commentId } = req.body;

    if (!commentId) {
      return createAPIError(400, `Please specify commentId`, res);
    }

    const postId = req.params.id;

    const post: any = await checkIfPostExists(postId, res);

    const { success, code, data, comment } = await updateCommentById(
      post,
      commentId,
      userId,
      'saves',
      res
    );

    if (!success) {
      if (code == 1) {
        return createAPIError(404, `No comment found!`, res);
      }

      if (code == 2) {
        return createAPIError(404, `Already saved!`, res);
      }
    }

    post.comments = data;

    await post.save();

    const final: any = await SandBoxSocial.findById(postId)
      .populate('creator', '_id username profileImg firstName lastName')
      .populate(
        'comments.creator',
        '_id username profileImg firstName lastName'
      )
      .populate(
        'comments.replies.creator',
        '_id username profileImg firstName lastName'
      );

    await LibrarySchema.create({
      docModel: 'sandboxsocial',
      commentId,
      message: comment.text,
      contentId: postId.toString().trim(),
      createdBy: userId,
      updatedBy: userId,
      tag: '#sandbox',
      postType: 'comment'
    });

    return res.status(200).json({ success: true, data: final });
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const createContentFromComment = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    const { commentId } = req.body;

    if (!commentId) {
      return createAPIError(400, `Please specify commentId`, res);
    }

    const postId = req.params.id;

    const post: any = await checkIfPostExists(postId, res);

    const { success, code, data } = await updateCommentById(
      post,
      commentId,
      userId,
      'contentCreated',
      res
    );

    if (!success) {
      if (code == 1) {
        return createAPIError(404, `No comment found!`, res);
      }

      if (code == 2) {
        return createAPIError(404, `Content created already!`, res);
      }
    }

    post.comments = data;

    await post.save();

    const final: any = await SandBoxSocial.findById(postId)
      .populate('creator', '_id username profileImg firstName lastName')
      .populate(
        'comments.creator',
        '_id username profileImg firstName lastName'
      )
      .populate(
        'comments.replies.creator',
        '_id username profileImg firstName lastName'
      );

    return res.status(200).json({ success: true, data: final });
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const removeUpvoteFromComment = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    const { commentId } = req.body;

    if (!commentId) {
      return createAPIError(400, `Please specify commentId`, res);
    }

    const postId = req.params.id;

    const post: any = await checkIfPostExists(postId, res);

    const { success, code, data, comment } = await updateCommentById(
      post,
      commentId,
      userId,
      'upvotes',
      res,
      true
    );

    if (!success) {
      if (code == 1) {
        return createAPIError(404, `No comment found!`, res);
      }

      if (code == 2) {
        return createAPIError(404, `Upvote already removed!`, res);
      }
    }

    post.comments = data;

    const final: any = await SandBoxSocial.findById(postId)
      .populate('creator', '_id username profileImg firstName lastName')
      .populate(
        'comments.creator',
        '_id username profileImg firstName lastName'
      )
      .populate(
        'comments.replies.creator',
        '_id username profileImg firstName lastName'
      );

    await post.save();
    return res.status(200).json({ success: true, data: final });
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const unsaveComment = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    const { commentId } = req.body;

    if (!commentId) {
      return createAPIError(400, `Please specify commentId`, res);
    }

    const postId = req.params.id;

    const post: any = await checkIfPostExists(postId, res);

    const { success, code, data } = await updateCommentById(
      post,
      commentId,
      userId,
      'saves',
      res,
      true // matlab we are unsaving/ removing upvotes
    );

    if (!success) {
      if (code == 1) {
        return createAPIError(404, `No comment found!`, res);
      }

      if (code == 2) {
        return createAPIError(404, `Already unsaved!`, res);
      }
    }

    post.comments = data;

    await post.save();

    const final: any = await SandBoxSocial.findById(postId)
      .populate('creator', '_id username profileImg firstName lastName')
      .populate(
        'comments.creator',
        '_id username profileImg firstName lastName'
      )
      .populate(
        'comments.replies.creator',
        '_id username profileImg firstName lastName'
      );

    await LibrarySchema.findOneAndDelete({
      commentId: commentId.toString(),
      contentId: postId.toString().trim(),
      createdBy: userId
    });
    return res.status(200).json({ success: true, data: final });
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const checkIfCommentExists = (post, commentId) => {
  const comments = post.comments;

  let checkComments = comments.filter((comment) => {
    return comment['_id'].toString() == commentId;
  });

  if (!checkComments || checkComments.length == 0) {
    return { success: false, message: 'No comment found!' };
  }

  return { success: true, data: checkComments[0] };
};

const replyToComment = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    const { commentId, comment } = req.body;

    if (!commentId || !comment) {
      return createAPIError(400, `Please specify commentId and comment`, res);
    }

    const postId = req.params.id;

    const post: any = await checkIfPostExists(postId, res);

    const {
      data: originalComment,
      success,
      message
    } = checkIfCommentExists(post, commentId);

    if (!success) {
      return createAPIError(404, message, res);
    }

    const user = await UserSchema.findById(userId);

    originalComment.replies.push({
      text: comment,
      creator: userId
    });

    let updatedComments = post.comments.map((comment) => {
      if (comment._id.toString() == commentId.toString()) {
        let reason = 'reply';
        // data here refers to the original comment:
        if (originalComment.creator.toString() != userId.toString()) {
          if (
            originalComment.tokensGenerated +
              SOCIALTRANSACTIONS[SANDBOX_CONSTANTS[reason]] <=
            25
          ) {
            handleTransactions({
              sender: userId.toString(),
              reciever: originalComment.creator.toString(),
              add: true,
              reason,
              res,
              postId,
              commentId,
              comment: originalComment.text
            });
            originalComment.tokensGenerated +=
              SOCIALTRANSACTIONS[SANDBOX_CONSTANTS[reason]];
          }
          originalComment.actualTokensGenerated +=
            SOCIALTRANSACTIONS[SANDBOX_CONSTANTS[reason]];
        }
        return originalComment;
      }
      return comment;
    });

    post.comments = updatedComments;

    await post.save();

    const final: any = await SandBoxSocial.findById(postId)
      .populate('creator', '_id username profileImg firstName lastName')
      .populate(
        'comments.creator',
        '_id username profileImg firstName lastName'
      )
      .populate(
        'comments.replies.creator',
        '_id username profileImg firstName lastName'
      );

    return res.status(200).json({ success: true, data: final });
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const checkIfReplyExists = (comment, replyId) => {
  const replies = comment.replies;

  let checkReplies = replies.filter(
    (reply) => reply['_id'].toString() == replyId
  );

  if (!checkReplies || checkReplies.length == 0) {
    return { success: false, message: 'No reply found!' };
  }

  return { success: true, data: checkReplies[0] };
};

const editReply = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    const { commentId, replyId, text } = req.body;

    if (!commentId || !replyId || !text) {
      return createAPIError(
        400,
        `Please specify commentId, text and replyId`,
        res
      );
    }

    const postId = req.params.id;

    const post: any = await checkIfPostExists(postId, res);

    let { data, success, message } = checkIfCommentExists(post, commentId);

    if (!success) {
      return createAPIError(404, message, res);
    }

    let replyResponse = checkIfReplyExists(data, replyId);

    if (!replyResponse.success) {
      return createAPIError(404, replyResponse.message, res);
    }

    let reply = replyResponse.data;

    if (reply.creator.toString() != userId.toString()) {
      return createAPIError(
        401,
        `Not authorized to edit someone else's reply`,
        res
      );
    }

    reply.text = text;

    const updatedComments = post.comments.map((comment) => {
      if (comment._id.toString() == commentId) {
        let replies = comment.replies.map((item) => {
          if (item._id.toString() == replyId) {
            return reply;
          }
          return item;
        });
        comment.replies = replies;
        return comment;
      }
      return comment;
    });

    post.comments = updatedComments;
    await post.save();

    const final: any = await SandBoxSocial.findById(postId)
      .populate('creator', '_id username profileImg firstName lastName')
      .populate(
        'comments.creator',
        '_id username profileImg firstName lastName'
      )
      .populate(
        'comments.replies.creator',
        '_id username profileImg firstName lastName'
      );

    return res.status(200).json({ success: true, data: final });
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const deleteReply = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    const { commentId, replyId } = req.body;

    if (!commentId || !replyId) {
      return createAPIError(400, `Please specify commentId and replyId`, res);
    }

    const postId = req.params.id;

    const post: any = await checkIfPostExists(postId, res);

    let { data, success, message } = checkIfCommentExists(post, commentId);

    if (!success) {
      return createAPIError(404, message, res);
    }

    let replyResponse = checkIfReplyExists(data, replyId);

    if (!replyResponse.success) {
      return createAPIError(404, replyResponse.message, res);
    }

    let reply = replyResponse.data;

    const user = await UserSchema.findById(userId);

    if (reply.creator.toString() != userId.toString() && !user.isAdmin) {
      return createAPIError(
        401,
        `Not authorized to delete someone else's reply`,
        res
      );
    }

    const updatedComments = post.comments.map((comment) => {
      if (comment._id.toString() == commentId) {
        let replies = comment.replies.filter(
          (reply) => reply._id.toString() != replyId
        );

        let reason = 'reply';
        // data here refers to the original comment:
        if (comment.creator.toString() != userId.toString()) {
          if (
            comment.actualTokensGenerated -
              SOCIALTRANSACTIONS[SANDBOX_CONSTANTS[reason]] <
            25
          ) {
            handleTransactions({
              sender: userId.toString(),
              reciever: comment.creator.toString(),
              add: false, // false?
              reason,
              res,
              postId,
              commentId,
              replyId
            });
            comment.tokensGenerated -=
              SOCIALTRANSACTIONS[SANDBOX_CONSTANTS[reason]];
          }
          comment.actualTokensGenerated -=
            SOCIALTRANSACTIONS[SANDBOX_CONSTANTS[reason]];
        }

        comment.replies = replies;

        return comment;
      }
      return comment;
    });

    post.comments = updatedComments;
    await post.save();

    const final: any = await SandBoxSocial.findById(postId)
      .populate('creator', '_id username profileImg firstName lastName')
      .populate(
        'comments.creator',
        '_id username profileImg firstName lastName'
      )
      .populate(
        'comments.replies.creator',
        '_id username profileImg firstName lastName'
      );

    // const user = await UserSchema.findById(userId);

    user.sandboxPoints -= reply.tokensGenerated;
    user.save();

    const transactionReason = SANDBOX_CONSTANTS['reply'];
    ActivityService.deleteReplyActivity(
      postId,
      commentId,
      replyId,
      userId,
      transactionReason
    );

    return res.status(200).json({ success: true, data: final });
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

// this will handle updating the reply and also transactions for that action:
const updateReplyById = async (
  comment,
  userId,
  replyId,
  type,
  postId,
  res,
  credit = true
) => {
  const { data, success, message } = checkIfReplyExists(comment, replyId);

  if (!success) {
    return { success: false, message, code: 1 };
  }

  let reply = data;

  const types = reply[`${type}`].filter((item) => item == userId);

  if (credit) {
    if (types.length > 0) {
      // code 1 stands for such upvote/save/createContent already exists:
      return { success: false, code: 2 };
    }

    // add the userId to reply.saves/upvotes/contentCreated
    reply[`${type}`].push(userId.toString());
  } else {
    if (types.length == 0) {
      // here code 1 stands for "no" such upvote/save/createContent exists already:
      return { success: false, code: 2 };
    }

    // filter out that save/upvote from here:
    let updatedType = reply[`${type}`].filter((item) => item != userId);
    // save it here:
    reply[`${type}`] = updatedType;
  }

  // handle transactions:
  let reason = '';
  if (type == 'upvotes') reason = 'upvote';
  if (type == 'contentCreated') reason = 'content';
  if (type == 'saves') reason = 'save';

  /*
  every reply is a comment in the end, and hence we are using the same generic 
  template in here:
  */
  //  this will update our activity schema and points on that reply:
  const commentId = comment._id;
  reply = await handlePointsForComments(
    userId,
    reply,
    reason,
    credit,
    res,
    postId,
    commentId,
    replyId
  );

  // update the comment:
  let updatedReplies = comment.replies.map((item) => {
    if (item._id.toString() == replyId) {
      return reply;
    }
    return item;
  });

  comment.replies = updatedReplies;

  // return this updatedComment back:
  return { success: true, data: comment, reply };
};

const saveReply = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    const { commentId, replyId } = req.body;

    if (!commentId || !replyId) {
      return createAPIError(400, `Please specify commentId and replyId`, res);
    }

    const postId = req.params.id;

    const post: any = await checkIfPostExists(postId, res);

    let {
      data: commentData,
      success: commentFound,
      message
    } = checkIfCommentExists(post, commentId);

    if (!commentFound) {
      return createAPIError(404, message, res);
    }

    let { success, code, data, reply } = await updateReplyById(
      commentData,
      userId,
      replyId,
      'saves',
      postId,
      res
    );

    if (!success) {
      if (code == 1) {
        return createAPIError(404, 'No reply found!', res);
      }
      if (code == 2) {
        return createAPIError(400, 'Already saved reply!', res);
      }
    }

    const updatedComments = post.comments.map((comment) => {
      if (comment._id.toString() == commentId) {
        return data;
      }
      return comment;
    });

    post.comments = updatedComments;
    await post.save();

    const final: any = await SandBoxSocial.findById(postId)
      .populate('creator', '_id username profileImg firstName lastName')
      .populate(
        'comments.creator',
        '_id username profileImg firstName lastName'
      )
      .populate(
        'comments.replies.creator',
        '_id username profileImg firstName lastName'
      );

    LibrarySchema.create({
      docModel: 'qa',
      message: reply.text,
      replyId,
      commentId,
      contentId: postId.toString().trim(),
      createdBy: userId,
      updatedBy: userId,
      tag: '#sandbox',
      postType: 'reply'
    });

    return res.status(200).json({ success: true, data: final });
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const unsaveReply = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    const { commentId, replyId } = req.body;

    if (!commentId || !replyId) {
      return createAPIError(400, `Please specify commentId and replyId`, res);
    }

    const postId = req.params.id;

    const post: any = await checkIfPostExists(postId, res);

    let {
      data: commentData,
      success: commentFound,
      message
    } = checkIfCommentExists(post, commentId);

    if (!commentFound) {
      return createAPIError(404, message, res);
    }

    let { success, code, data } = await updateReplyById(
      commentData,
      userId,
      replyId,
      'saves',
      postId,
      res,
      false // this is the only change:
    );

    if (!success) {
      if (code == 1) {
        return createAPIError(404, 'No reply found!', res);
      }
      if (code == 2) {
        return createAPIError(400, 'Already unsaved!', res);
      }
    }

    const updatedComments = post.comments.map((comment) => {
      if (comment._id.toString() == commentId) {
        return data;
      }
      return comment;
    });

    post.comments = updatedComments;
    await post.save();

    const final: any = await SandBoxSocial.findById(postId)
      .populate('creator', '_id username profileImg firstName lastName')
      .populate(
        'comments.creator',
        '_id username profileImg firstName lastName'
      )
      .populate(
        'comments.replies.creator',
        '_id username profileImg firstName lastName'
      );

    await LibrarySchema.findOneAndDelete({
      replyId,
      commentId,
      contentId: postId.toString().trim(),
      createdBy: userId
    });

    return res.status(200).json({ success: true, data: final });
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const upvoteReply = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    const { commentId, replyId } = req.body;

    if (!commentId || !replyId) {
      return createAPIError(400, `Please specify commentId and replyId`, res);
    }

    const postId = req.params.id;

    const post: any = await checkIfPostExists(postId, res);

    let {
      data: commentData,
      success: commentFound,
      message
    } = checkIfCommentExists(post, commentId);

    if (!commentFound) {
      return createAPIError(404, message, res);
    }

    let { success, code, data } = await updateReplyById(
      commentData,
      userId,
      replyId,
      'upvotes', // this is the only change
      postId,
      res
    );

    if (!success) {
      if (code == 1) {
        return createAPIError(404, 'No reply found!', res);
      }
      if (code == 2) {
        return createAPIError(400, 'Already upvoted!', res);
      }
    }

    const updatedComments = post.comments.map((comment) => {
      if (comment._id.toString() == commentId) {
        return data;
      }
      return comment;
    });

    post.comments = updatedComments;
    await post.save();

    const final: any = await SandBoxSocial.findById(postId)
      .populate('creator', '_id username profileImg firstName lastName')
      .populate(
        'comments.creator',
        '_id username profileImg firstName lastName'
      )
      .populate(
        'comments.replies.creator',
        '_id username profileImg firstName lastName'
      );

    return res.status(200).json({ success: true, data: final });
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const unUpvoteReply = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    const { commentId, replyId } = req.body;

    if (!commentId || !replyId) {
      return createAPIError(400, `Please specify commentId and replyId`, res);
    }

    const postId = req.params.id;

    const post: any = await checkIfPostExists(postId, res);

    let {
      data: commentData,
      success: commentFound,
      message
    } = checkIfCommentExists(post, commentId);

    if (!commentFound) {
      return createAPIError(404, message, res);
    }

    let { success, code, data } = await updateReplyById(
      commentData,
      userId,
      replyId,
      'upvotes', // only change
      postId,
      res,
      false
    );

    if (!success) {
      if (code == 1) {
        return createAPIError(404, 'No reply found!', res);
      }
      if (code == 2) {
        return createAPIError(400, 'Already removed upvote!', res);
      }
    }

    const updatedComments = post.comments.map((comment) => {
      if (comment._id.toString() == commentId) {
        return data;
      }
      return comment;
    });

    post.comments = updatedComments;
    await post.save();

    const final: any = await SandBoxSocial.findById(postId)
      .populate('creator', '_id username profileImg firstName lastName')
      .populate(
        'comments.creator',
        '_id username profileImg firstName lastName'
      )
      .populate(
        'comments.replies.creator',
        '_id username profileImg firstName lastName'
      );

    return res.status(200).json({ success: true, data: final });
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const createContentFromReply = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    const { commentId, replyId } = req.body;

    if (!commentId || !replyId) {
      return createAPIError(400, `Please specify commentId and replyId`, res);
    }

    const postId = req.params.id;

    const post: any = await checkIfPostExists(postId, res);

    let {
      data: commentData,
      success: commentFound,
      message
    } = checkIfCommentExists(post, commentId);

    if (!commentFound) {
      return createAPIError(404, message, res);
    }

    let { success, code, data } = await updateReplyById(
      commentData,
      userId,
      replyId,
      'contentCreated', // this is the only change
      postId,
      res
    );

    if (!success) {
      if (code == 1) {
        return createAPIError(404, 'No reply found!', res);
      }
      if (code == 2) {
        return createAPIError(400, 'Already created content!', res);
      }
    }

    const updatedComments = post.comments.map((comment) => {
      if (comment._id.toString() == commentId) {
        return data;
      }
      return comment;
    });

    post.comments = updatedComments;
    await post.save();

    const final: any = await SandBoxSocial.findById(postId)
      .populate('creator', '_id username profileImg firstName lastName')
      .populate(
        'comments.creator',
        '_id username profileImg firstName lastName'
      )
      .populate(
        'comments.replies.creator',
        '_id username profileImg firstName lastName'
      );

    return res.status(200).json({ success: true, data: final });
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const getDropDownItems = async (req: any, res: Response) => {
  try {
    const data = SandboxTopics;

    return res.status(200).json({ success: true, data });
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const getInteractedPosts = async (req: any, res: Response) => {
  try {
    const userId = req.user.id.toString();

    const data = await SandBoxSocial.find({
      $or: [
        { saves: userId },
        { contentCreated: userId },
        { upvotes: userId },
        { 'comments.creator': userId },
        { 'comments.saves': userId },
        { 'comments.contentCreated': userId },
        { 'comments.upvotes': userId },
        { 'comments.replies.creator': userId },
        { 'comments.replies.saves': userId },
        { 'comments.replies.upvotes': userId },
        { 'comments.replies.contentCreated': userId }
      ]
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const handlePointsToToken = async (req: any, res: Response) => {
  try {
    const userId = req.user.id.toString();

    const { pointsToConvert } = req.body;

    const pointsToTokenMap = {
      50: 6666,
      75: 10666,
      100: 16000
    };

    if (!Object.keys(pointsToTokenMap).includes('' + pointsToConvert)) {
      return res
        .status(400)
        .json({ success: false, message: 'Inavlid pointsToConvert' });
    }

    const user = await UserService.getUserDetails(userId);

    // check the sandboxPoints, and make sure that the redemmedTokens are subtracted!
    if (user.sandboxPoints - user.redeemedTokens < pointsToConvert) {
      return res.status(400).json({
        success: false,
        message: 'Not enough sandbox points to convert'
      });
    }

    const oneMonthInMs = 30 * 24 * 60 * 60 * 1000;
    const tokens = pointsToTokenMap[pointsToConvert];

    user.redeemedTokens += pointsToConvert;

    user.tokenWallet.tokens += tokens;
    user.tokenWallet.expiresAt = (new Date(
      user.tokenWallet.expiresAt as any
    ).getTime() + oneMonthInMs) as any;

    await user.save();

    await TokenTransactionSchema.create({
      transactionType: 'credit',
      tokens,
      source: 'Reward Tokens',
      expiresAt: user.tokenWallet.expiresAt,
      userId: user._id,
      updatedWallet: true
    });

    return res.status(200).json({ success: true, user });
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

const topPosts = async (req: any, res: Response) => {
  try {
    const oneMonthInMs = 30 * 24 * 60 * 60 * 1000;

    let timeOfPosts = new Date(
      new Date().getTime() - new Date(oneMonthInMs).getTime()
    );

    // const topPosts = await SandBoxSocial.aggregate([
    //   { $match: { createdAt: { $gte: timeOfPosts } } },
    //   {
    //     $lookup: {
    //       from: 'users',
    //       localField: 'creator',
    //       foreignField: '_id',
    //       as: 'creator'
    //     }
    //   },
    //   {
    //     $lookup: {
    //       from: 'users',
    //       localField: 'upvotes',
    //       foreignField: '_id',
    //       as: 'upvoters'
    //     }
    //   },
    //   {
    //     $project: {
    //       upvotesCount: { $size: '$upvotes' },
    //       creator: {
    //         _id: 1,
    //         username: 1,
    //         profileImg: 1,
    //         firstName: 1,
    //         lastName: 1
    //       },
    //       upvotes: 1,
    //       upvotedPeople: {
    //         $map: {
    //           input: '$upvoters',
    //           as: 'upvoter',
    //           in: {
    //             _id: '$$upvoter._id',
    //             username: '$$upvoter.username',
    //             email: '$$upvoter.email'
    //           }
    //         }
    //       }
    //     }
    //   },
    //   {
    //     $sort: {
    //       upvotesCount: -1
    //     }
    //   }
    // ]);

    let topPosts = await SandBoxSocial.find({
      isDeleted: false,
      createdAt: { $gte: timeOfPosts }
    })
      .sort({ upvotes: -1 })
      .populate('creator', '_id username profileImg firstName lastName')
      .populate(
        'comments.creator',
        '_id username profileImg firstName lastName'
      )
      .populate(
        'comments.replies.creator',
        '_id username profileImg firstName lastName'
      );

    //   descending sorting!
    topPosts.sort(function (x, y) {
      return y.upvotes.length - x.upvotes.length;
    });

    topPosts = topPosts.slice(0, 10);

    return res.status(200).json({ success: true, data: topPosts });
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(500, err, res);
  }
};

export = {
  getAllPosts,
  getSinglePost,
  updatePost,
  createPost,
  deletePost,
  savePost,
  unsavePost,
  createComment,
  updateComment,
  deleteComment,
  upvotePost,
  removeUpvote,
  createContentFromPost,
  getCreatedPosts,
  upvoteComment,
  saveComment,
  createContentFromComment,
  removeUpvoteFromComment,
  unsaveComment,
  replyToComment,
  editReply,
  deleteReply,
  saveReply,
  unsaveReply,
  upvoteReply,
  unUpvoteReply,
  createContentFromReply,
  getDropDownItems,
  getInteractedPosts,
  handlePointsToToken,
  topPosts
};
