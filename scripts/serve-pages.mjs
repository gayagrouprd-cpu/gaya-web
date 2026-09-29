#!/usr/bin/env node
// Servidor estático que imita a GitHub Pages para probar el sitio "tal como se publica":
//  - distingue mayúsculas y minúsculas en las rutas (Pages corre en Linux; Windows no)
//  - "/carpeta" -> 301 a "/carpeta/" y sirve index.html; sin index.html => 404 (sin listado)
//  - "/pagina" sirve pagina.html si existe
//  - 404 con el contenido de /404.html
//  - Cache-Control: max-age=600, CORS abierto, solo gzip (sin brotli)
// Uso: node scripts/serve-pages.mjs [--dir dist] [--port 4173] [--host 127.0.0.1] [--log]
import http from 'node:http';
import { createReadStream } from 'node:fs';
import { readdir, stat, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.vcf': 'text/vcard; charset=utf-8',
};
const COMPRESSIBLE = /^(text\/|application\/(javascript|json|xml|manifest\+json)|image\/svg\+xml)/;

export function createPagesServer({ dir = 'dist', log = false } = {}) {
  const root = resolve(dir);
  const dirCache = new Map();

  async function entries(dirPath) {
    if (dirCache.has(dirPath)) return dirCache.get(dirPath);
    let set = null;
    try {
      set = new Set(await readdir(dirPath));
    } catch {
      set = null;
    }
    dirCache.set(dirPath, set);
    setTimeout(() => dirCache.delete(dirPath), 750).unref();
    return set;
  }

  /** Resuelve segmentos exactamente (con mayúsculas) o devuelve null. */
  async function exact(segments) {
    let cur = root;
    for (const s of segments) {
      const e = await entries(cur);
      if (!e || !e.has(s)) return null;
      cur = join(cur, s);
    }
    return cur;
  }

  async function kind(p) {
    try {
      const s = await stat(p);
      return s.isDirectory() ? 'dir' : 'file';
    } catch {
      return null;
    }
  }

  async function send(req, res, status, filePath, extraHeaders = {}) {
    const type = TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream';
    const headers = {
      'Content-Type': type,
      'Cache-Control': 'max-age=600',
      'Access-Control-Allow-Origin': '*',
      Vary: 'Accept-Encoding',
      ...extraHeaders,
    };
    const wantsGzip = /\bgzip\b/.test(String(req.headers['accept-encoding'] ?? ''));
    if (wantsGzip && COMPRESSIBLE.test(type)) {
      const body = gzipSync(await readFile(filePath));
      headers['Content-Encoding'] = 'gzip';
      headers['Content-Length'] = body.length;
      res.writeHead(status, headers);
      res.end(req.method === 'HEAD' ? undefined : body);
      return;
    }
    const size = (await stat(filePath)).size;
    headers['Content-Length'] = size;
    res.writeHead(status, headers);
    if (req.method === 'HEAD') return res.end();
    createReadStream(filePath).pipe(res);
  }

  async function notFound(req, res) {
    const page = await exact(['404.html']);
    if (page) return send(req, res, 404, page);
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    res.end('404');
  }

  return http.createServer(async (req, res) => {
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { Allow: 'GET, HEAD' });
        return res.end();
      }
      const u = new URL(req.url ?? '/', 'http://localhost');
      let pathname;
      try {
        pathname = decodeURIComponent(u.pathname);
      } catch {
        return notFound(req, res);
      }
      if (pathname.includes('\0') || pathname.includes('\\')) return notFound(req, res);
      const segments = pathname.split('/').filter(Boolean);
      if (segments.some((s) => s === '..' || s === '.')) return notFound(req, res);
      const endsWithSlash = pathname.endsWith('/');
      if (log) console.log(req.method, req.url);

      const target = await exact(segments);
      if (target) {
        const k = await kind(target);
        if (k === 'file' && !endsWithSlash) return send(req, res, 200, target);
        if (k === 'dir') {
          const index = await exact([...segments, 'index.html']);
          if (!index) return notFound(req, res);
          if (!endsWithSlash) {
            res.writeHead(301, { Location: pathname + '/' + u.search, 'Cache-Control': 'max-age=600' });
            return res.end();
          }
          return send(req, res, 200, index);
        }
      }
      if (!endsWithSlash && segments.length) {
        const html = await exact([...segments.slice(0, -1), segments.at(-1) + '.html']);
        if (html) return send(req, res, 200, html);
      }
      return notFound(req, res);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(String(err?.message ?? err));
    }
  });
}

export function listen(server, port = 0, host = '127.0.0.1') {
  return new Promise((resolvePromise, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => resolvePromise(server.address().port));
  });
}

// Ejecución directa
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const arg = (name, fallback) => {
    const i = process.argv.indexOf(`--${name}`);
    return i > -1 ? process.argv[i + 1] : fallback;
  };
  const dir = arg('dir', 'dist');
  const port = Number(arg('port', 4173));
  const host = arg('host', '127.0.0.1');
  const server = createPagesServer({ dir, log: process.argv.includes('--log') });
  listen(server, port, host).then((p) => console.log(`Como GitHub Pages: http://${host}:${p}/  (sirviendo ${resolve(dir)})`));
}
