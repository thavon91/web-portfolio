import { readFileSync } from 'node:fs';

// External PDF buttons still use these published URLs, independent of the game UI.
export function preservePdf(source, fileName) {
  return {
    name: `preserve-pdf-${fileName}`,
    generateBundle() {
      this.emitFile({ type: 'asset', fileName, source: readFileSync(source) });
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
        if (path !== `${server.config.base}${fileName}`) return next();
        res.setHeader('Content-Type', 'application/pdf');
        res.end(readFileSync(source));
      });
    },
  };
}
