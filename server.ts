import { serverApp } from './server-app';
import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const PORT = 3000;

  // Mount Vite development middleware or production static asset handlers
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    serverApp.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    serverApp.use(express.static(distPath));
    serverApp.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  serverApp.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
