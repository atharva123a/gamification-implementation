import jwt from 'jsonwebtoken';
import { JWT_SECRET, NODE_DEV } from '../config';
import createAPIError from './error';
import logger from './logger';
import { Response } from 'express';

const createJWT = ({ payload }, expiresIn) => {
  try {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn });
    return token;
  } catch (error) {
    let err = error.message || error;
    logger.error(err);
    createAPIError(400, `Error while creating token!`);
  }
};

const attachCookiesToResponse = ({ res, user, refreshToken }) => {
  let accessTokenExpiry = '1d';

  let refreshTokenExpiry = '7d';

  const accessTokenJWT = createJWT({ payload: user }, accessTokenExpiry);

  const refreshTokenJWT = createJWT(
    { payload: refreshToken },
    refreshTokenExpiry
  );

  const oneDay = 1000 * 60 * 60 * 24; // 1day;

  res.cookie('accessToken', accessTokenJWT, {
    httpOnly: true,
    secure: NODE_DEV === 'production',
    signed: true,
    maxAge: 1000 // 1sec
  });

  res.cookie('refreshToken', refreshTokenJWT, {
    httpOnly: true,
    expiresIn: new Date(Date.now() + oneDay),
    secure: NODE_DEV === 'production',
    signed: true
  });
};

const getTokens = (user) => {
  let accessTokenExpiry = '1d';

  let refreshTokenExpiry = '7d';

  const accessTokenJWT = createJWT(
    { payload: { user, type: 'accessToken' } },
    accessTokenExpiry
  );

  const refreshTokenJWT = createJWT(
    { payload: { user, type: 'refreshToken' } },
    refreshTokenExpiry
  );

  const accessToken = {
    accessTokenJWT,
    expiresIn: 1000 * 60 * 60 * 24 // 24 hrs!
  };

  const refreshToken = {
    refreshTokenJWT,
    expiresIn: 1000 * 60 * 60 * 24 * 7 // 7 days!
  };

  return { accessToken, refreshToken };
};

const isTokenValid = (token, res: Response) => {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload;
  } catch (err) {
    const error = err.message || err;
    logger.error(error);
    return createAPIError(
      401,
      'The token has expired! Please login again!',
      res
    );
  }
};

export { createJWT, attachCookiesToResponse, isTokenValid, getTokens };
