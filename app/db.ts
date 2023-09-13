import { connect, set } from 'mongoose';

import { ENV, MONGO_URI } from './config';

export async function initDb() {
  if (!MONGO_URI) throw new Error('invalid mongodb URI');

  if (ENV !== 'production') {
    set('debug', true);
  }

  const db = await connect(MONGO_URI);
  return db;
}
