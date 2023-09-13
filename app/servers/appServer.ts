import '../utils/auth';
import express from 'express';

import { CLIENT_URL, PORT } from '../config';

import { router as gamificationRouter } from '../sandboxSocial/sandboxRoutes';
import { initDb } from '../db';

import logger from '../utils/logger';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import http from 'http';

import { errorHandlerMiddleware } from '../middlewares/error-handler';
import { notFoundMiddleware } from '../middlewares/not-found';

const app = express();
const server = http.createServer(app);

app.use(compression());
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('[:date[web]] :method :url :status :response-time ms'));

export async function init() {
  try {
    logger.info('init');

    await initDb();
    initRouter();
    initServer();
  } catch (error) {
    logger.error('unable to initialize app: ', error);
  }
}

async function initRouter() {
  app.use('/sandbox', gamificationRouter);
}

async function initServer() {
  server.listen(PORT, () => {
    logger.info(`server is running at https://localhost:${PORT}`);
  });
}

init();
