import { Request, Response, NextFunction } from 'express';
import createAPIError from '../utils/error';

export const paginatedResults = (model, query) => {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page);
      const limit = parseInt(req.query.limit);

      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;

      const results = {};

      // next page:
      if (endIndex < (await model.countDocuments().exec())) {
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

      results['results'] = await model
        .find(query)
        .limit(limit)
        .skip(startIndex)
        .exec();

      console.log('results', results);

      res['paginatedResults'] = results;
      next();
    } catch (error) {
      const err = error.message || error;
      createAPIError(500, err, res);
    }
  };
};
