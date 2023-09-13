import logger from './logger';

// one among many other helper functions
export const sortedPagination = async ({
  model,
  query,
  page,
  limit,
  sortBy
}) => {
  try {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const results = {};
    let maxResults = await model.countDocuments(query).exec();

    // next page:
    if (endIndex < maxResults) {
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
      .sort(sortBy)
      .limit(limit)
      .skip(startIndex)
      .exec();

    return { success: true, data: results };
  } catch (error) {
    let err = error.msg || error;
    logger.error(err);
    return { success: false, message: err };
  }
};
