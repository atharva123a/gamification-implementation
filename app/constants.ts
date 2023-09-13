export const SANDBOX_CONSTANTS = {
  qa: 'QATRANSACTIONS',
  hotTake: 'HOTTAKETRANSACTIONS',
  platform: 'PLATFORMTRANSACTIONS',
  content: `RECIEVED_CONVERT_TO_CONTENT`,
  upvote: 'RECEIVED_UPVOTE',
  save: 'RECEIVED_SAVE',
  comment: 'RECEIVED_COMMENT',
  reply: 'RECEIVED_REPLY',
  twitter: 'TWITTER_POST',
  linkedIn: 'LINKEDIN_POST',
  blog: 'BLOG',
  social: 'SOCIALTRANSACTIONS',
  deletedComment: 'DELETED_COMMENT',
  deletedReply: 'DELETED_REPLY'
};

export const SOCIALTRANSACTIONS = {
  RECEIVED_UPVOTE: 1,
  RECEIVED_COMMENT: 0,
  RECEIVED_SAVE: 1,
  RECIEVED_CONVERT_TO_CONTENT: 1,
  RECEIVED_REPLY: 0
};

export const DROPDOWN = [
  'Product',
  'Tech',
  'Venture Capital',
  'Sales',
  'Business Strategy',
  'Finance',
  'Leadership and Management'
];

// there were a few more
export const SandboxTopics = {
  StartupsAndEntrepreneurship: {
    topic: 'Startups and Entrepreneurship',
    image:
      'https://hushl-aws-bucket.s3.ap-south-1.amazonaws.com/sandboxTopicLogos/growth.png'
  },
  MarketingAndSales: {
    topic: 'Marketing and Sales',
    image:
      'https://hushl-aws-bucket.s3.ap-south-1.amazonaws.com/sandboxTopicLogos/promotion.png'
  }
};
