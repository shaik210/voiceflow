import express, { Express } from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { loggerMiddleware } from './middleware/logger.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { config } from './config/index.js';

const app: Express = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use(loggerMiddleware);

// Mount API routes
app.use('/api', routes);

// Global Error Handler
app.use(errorMiddleware);

export default app;
