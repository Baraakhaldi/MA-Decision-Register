// Saves form answers into the GitHub repo, one file per username: data/answers/<username>.json
// The GitHub token lives only in Cloudflare as the secret GITHUB_TOKEN.
const ORIGIN = 'https://baraakhaldi.github.io';
const USER_RE = /^[a-z0-9_-]{2,30}$/;

const cors = {
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors } });

const b64 = s => { let x = ''; new TextEncoder().encode(s).forEach(c => (x += String.fromCharCode(c))); return btoa(x); };
const unb64 = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g, '')), c => c.charCodeAt(0)));

function gh(env, path, init = {}) {
  return fetch(`https://api.github.com/repos/${env.REPO}/contents/${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      'User-Agent': 'ma-decision-register',
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
}

async function readFile(env, path) {
  const r = await gh(env, `${path}?ref=${env.BRANCH}`);
  if (r.status === 404) return { data: null, sha: null };
  if (!r.ok) throw new Error(`GitHub read ${r.status}`);
  const j = await r.json();
  return { data: JSON.parse(unb64(j.content)), sha: j.sha };
}

async function writeFile(env, path, data, message) {
  for (let i = 0; i < 3; i++) {
    const { sha } = await readFile(env, path);
    const body = { message, branch: env.BRANCH, content: b64(JSON.stringify(data, null, 1)) };
    if (sha) body.sha = sha;
    const r = await gh(env, path, { method: 'PUT', body: JSON.stringify(body) });
    if (r.ok) return;
    if (r.status !== 409 && r.status !== 422) throw new Error(`GitHub write ${r.status}`);
  }
  throw new Error('GitHub write conflict');
}

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    const url = new URL(req.url);
    const m = url.pathname.match(/^\/answers\/([^/]+)$/);
    if (!m) return json({ error: 'not found' }, 404);
    const user = decodeURIComponent(m[1]).toLowerCase();
    if (!USER_RE.test(user)) return json({ error: 'Username: 2–30 letters, numbers, - or _' }, 400);
    const path = `data/answers/${user}.json`;
    try {
      if (req.method === 'GET') {
        const { data } = await readFile(env, path);
        return data ? json(data) : json({ error: 'no answers yet' }, 404);
      }
      if (req.method === 'PUT') {
        const text = await req.text();
        if (text.length > 50000) return json({ error: 'too large' }, 413);
        const inb = JSON.parse(text);
        if (!inb || typeof inb.lines !== 'object') return json({ error: 'bad body' }, 400);
        const data = { username: user, submitted: !!inb.submitted, submitted_at: new Date().toISOString(), lines: inb.lines };
        await writeFile(env, path, data, `${user}: ${data.submitted ? 'submitted' : 'saved'} answers`);
        return json(data);
      }
      return json({ error: 'method not allowed' }, 405);
    } catch (e) {
      return json({ error: String(e.message || e) }, 502);
    }
  },
};
