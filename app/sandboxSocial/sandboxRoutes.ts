import { Response, Router } from 'express';
import { authenticateUser } from '../middlewares/authentication';

export const router = Router();
import sandBoxSocial from './sandboxSocialService';

/* the idea for levels was to allow users to do somethings when they were of a certain 
level(based on number of tokens); we later removed it to encourage more users to create posts
*/
import {
  checkForAdmin,
  checkForLevel1,
  checkForLevel2,
  checkForLevel3
} from '../utils/middleware/checkForLevel';

// routes:
router.get('/', sandBoxSocial.getAllPosts);

router.get('/dropdown', sandBoxSocial.getDropDownItems);

router.get(
  '/getInteractedPosts',
  authenticateUser,
  sandBoxSocial.getInteractedPosts
);

// get user created hotTakes:
router.get('/created/:userId', sandBoxSocial.getCreatedPosts);

router.get('/top-posts', sandBoxSocial.topPosts);

// CRUD:
router.get('/:id', sandBoxSocial.getSinglePost);

router.post(
  '/',
  authenticateUser,
  //  checkForLevel2,
  sandBoxSocial.createPost
);
router.patch(
  '/:id',
  authenticateUser,
  //   checkForLevel2,
  sandBoxSocial.updatePost
);
router.delete(
  '/:id',
  authenticateUser,
  //   checkForLevel2,
  sandBoxSocial.deletePost
);

// create content from hot-takes
router.post(
  '/content/:id',
  authenticateUser,
  sandBoxSocial.createContentFromPost
);

// save and unsave hot-take:

router.post('/save/:id', authenticateUser, sandBoxSocial.savePost);
router.delete('/save/:id', authenticateUser, sandBoxSocial.unsavePost);

// upvote and remove upvote:
router.post('/upvote/:id', authenticateUser, sandBoxSocial.upvotePost);
router.delete('/upvote/:id', authenticateUser, sandBoxSocial.removeUpvote);

// CRUD for comments:
router.post(
  '/comment/:id',
  authenticateUser,
//   checkForLevel1,
  sandBoxSocial.createComment
);
router.patch(
  '/comment/:id',
  authenticateUser,
//   checkForLevel1,
  sandBoxSocial.updateComment
);
router.delete(
  '/comment/:id',
  authenticateUser,
//   checkForLevel1,
  sandBoxSocial.deleteComment
);

// do things with comments:
router.post('/comment/save/:id', authenticateUser, sandBoxSocial.saveComment);
router.delete(
  '/comment/save/:id',
  authenticateUser,
  sandBoxSocial.unsaveComment
);
router.post(
  '/comment/content/:id',
  authenticateUser,
  sandBoxSocial.createContentFromComment
);
router.post(
  '/comment/upvote/:id',
  authenticateUser,
  sandBoxSocial.upvoteComment
);
router.delete(
  '/comment/upvote/:id',
  authenticateUser,
  sandBoxSocial.removeUpvoteFromComment
);

router.post(
  '/comment/reply/:id',
  authenticateUser,
  //   checkForLevel1,
  sandBoxSocial.replyToComment
);
router.patch(
  '/comment/reply/:id',
  authenticateUser,
  //   checkForLevel1,
  sandBoxSocial.editReply
);
router.delete(
  '/comment/reply/:id',
  authenticateUser,
  //   checkForLevel1,
  sandBoxSocial.deleteReply
);

// do things with replies:
router.post(
  '/comment/reply/save/:id',
  authenticateUser,
  sandBoxSocial.saveReply
);
router.delete(
  '/comment/reply/save/:id',
  authenticateUser,
  sandBoxSocial.unsaveReply
);
router.post(
  '/comment/reply/upvote/:id',
  authenticateUser,
  sandBoxSocial.upvoteReply
);
router.delete(
  '/comment/reply/upvote/:id',
  authenticateUser,
  sandBoxSocial.unUpvoteReply
);
router.post(
  '/comment/reply/content/:id',
  authenticateUser,
  sandBoxSocial.createContentFromReply
);

router.post(
  '/points-to-tokens',
  authenticateUser,
  sandBoxSocial.handlePointsToToken
);
