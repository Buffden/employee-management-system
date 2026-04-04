import OFFLINE_HTML from './offline.html';
import OFFLINE_CSS from './offline.css';

const STATIC_ASSETS = new Map([
  ['/offline.css', { body: OFFLINE_CSS, contentType: 'text/css; charset=utf-8' }],
]);

function serveStatic(asset) {
  return new Response(asset.body, {
    status: 200,
    headers: { 'Content-Type': asset.contentType },
  });
}

function serveOffline() {
  return new Response(OFFLINE_HTML, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

async function handleRequest(request) {
  const { pathname } = new URL(request.url);

  const asset = STATIC_ASSETS.get(pathname);
  if (asset) return serveStatic(asset);

  try {
    const response = await fetch(request);
    return response.status >= 500 ? serveOffline() : response;
  } catch {
    return serveOffline();
  }
}

export default { fetch: handleRequest };
