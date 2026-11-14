import fs from 'node:fs';
import path from 'node:path';
import cookieParser from 'cookie-parser';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { connectDatabase, getDbMode } from './server/config/database';
import { env } from './server/config/env';
import { errorHandler } from './server/middleware/errorHandler';
import authRoutes from './server/routes/authRoutes';
import { commentRouter, postRouter } from './server/routes/postRoutes';
import userRoutes from './server/routes/userRoutes';

async function startServer() {
  await connectDatabase();

  const app = express();
  app.set('trust proxy', 1);

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Serve generated assets reliably in both dev and production builds
  const generatedImagesDir = path.resolve(process.cwd(), 'src', 'assets', 'images');
  if (fs.existsSync(generatedImagesDir)) {
    app.use('/src/assets/images', express.static(generatedImagesDir));
  }

  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      service: 'connectly-api',
      dbMode: getDbMode(),
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/posts', postRouter);
  app.use('/api/comments', commentRouter);

  app.use('/api', (_req, res) => {
    res.status(404).json({
      success: false,
      error: 'API endpoint not found.',
    });
  });

  app.use(errorHandler);

  if (env.nodeEnv !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(env.port, '0.0.0.0', () => {
    console.log(
      `[Connectly] Full-stack server running at http://0.0.0.0:${env.port} (${env.nodeEnv})`
    );
  });
}

startServer().catch((err) => {
  console.error('[Connectly] Failed to start server:', err);
  process.exit(1);
});
