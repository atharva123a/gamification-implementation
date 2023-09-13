import { isTokenValid } from '../utils/jwt';
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import createAPIError from '../utils/error';
import UserSchema from '../user/userSchema';

const authenticateUser = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.headers.authorization || req.headers.authorization.length < 7) {
      return createAPIError(400, 'Please provide the accessToken!', res);
    }

    const accessToken = req.headers.authorization.split(' ')[1];

    const payload = isTokenValid(accessToken, res);

    if (!payload) {
      return createAPIError(
        401,
        'The token has expired! Please login again!',
        res
      );
    }

    req.user = payload['user'];

    const user = await UserSchema.findById(req.user.id);

    if (!user) {
      return createAPIError(404, `No user found with id: ${req.user.id}`, res);
    }

    return next();
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    createAPIError(401, 'Authentication failed!', res);
  }
};

export { authenticateUser };
