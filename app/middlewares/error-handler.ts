import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const errorHandlerMiddleware = (err, req, res, next) => {
  let customError = {
    statusCode: err.statusCode || 500,
    msg: err.message || 'Something went wrong! Please try again later!'
  };

  if (err.kind == 'ObjectId') {
    customError.msg =
      'Argument passed in as ObjectId must be a string of 12 bytes or a string of 24 hex characters or an integer';
    customError.statusCode = 400;
  }

  return res
    .status(customError.statusCode)
    .json({ success: false, msg: customError.msg });
};
