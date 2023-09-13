import { Request, Response, NextFunction } from 'express';
import logger from '../logger';
import createAPIError from '../error';
import UserSchema from '../../user/userSchema';

const checkForAdmin = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;

    const user: any = await UserSchema.findById(userId);
    if (!user.isAdmin) {
      return createAPIError(400, `Only admin can acces this route!`, res);
    }
    return next();
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(401, 'Authentication failed!', res);
  }
};

const checkForLevel2 = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;

    const user: any = await UserSchema.findById(userId);

    if (user.sandBoxLevel < 2 && !user.isAdmin) {
      return createAPIError(
        403,
        `Sorry! You need to be a Level 2 user to be able to post this.`,
        res
      );
    }
    return next();
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(401, 'Authentication failed!', res);
  }
};

const checkForLevel1 = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;

    const user: any = await UserSchema.findById(userId);
    if (user.sandBoxLevel < 1 && !user.isAdmin) {
      return createAPIError(
        403,
        `Sorry! You need to be a Level 1 user to be able to post this.`,
        res
      );
    }
    return next();
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(401, 'Authentication failed!', res);
  }
};

const checkForLevel3 = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;

    const user: any = await UserSchema.findById(userId);
    if (user.sandBoxLevel < 3 && !user.isAdmin) {
      return createAPIError(
        403,
        `Sorry! You need to be a Level 3 user to be able to post inside featured!.`,
        res
      );
    }
    return next();
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(401, 'Authentication failed!', res);
  }
};

export { checkForAdmin, checkForLevel1, checkForLevel2, checkForLevel3 };
