import SUNSET_HTML from './offline.html';
import SUNSET_CSS from './offline.css';

const STATIC_ASSETS = new Map([
  ['/offline.css', { body: SUNSET_CSS, contentType: 'text/css; charset=utf-8' }],
]);

function serveStatic(asset) {
  return new Response(asset.body, {
    status: 200,
    headers: { 'Content-Type': asset.contentType },
  });
}

function serveSunset() {
  return new Response(SUNSET_HTML, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

async function handleRequest(request) {
  const { pathname } = new URL(request.url);

  const asset = STATIC_ASSETS.get(pathname);
  if (asset) return serveStatic(asset);

  return serveSunset();
}

export default { fetch: handleRequest };
