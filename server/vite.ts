import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, type ViteDevServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function setupVite(app: Express, server: any) {
  const vite: ViteDevServer = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: { server },
    },
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use(async (req, res, next) => {
    // Only handle GET requests for HTML pages
    if (req.method !== 'GET') {
      return next();
    }

    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }
    const url = req.originalUrl;

    try {
      const clientPath = path.resolve(__dirname, "..", "client");
      let template = fs.readFileSync(
        path.resolve(__dirname, "..", "index.html"),
        "utf-8"
      );

      template = await vite.transformIndexHtml(url, template);

      const indexPath = path.join(clientPath, "src", "main.tsx");
      if (!fs.existsSync(indexPath)) {
        const srcMainPath = path.resolve(__dirname, "..", "src", "main.tsx");
        if (fs.existsSync(srcMainPath)) {
          const { render } = await vite.ssrLoadModule(srcMainPath);
          const appHtml = render ? render(url) : "";
          const html = template.replace(`<!--app-html-->`, appHtml);
          res.status(200).set({ "Content-Type": "text/html" }).end(html);
        } else {
          res.status(200).set({ "Content-Type": "text/html" }).end(template);
        }
      } else {
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      }
    } catch (e: any) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
