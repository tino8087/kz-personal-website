export const EVENT_NAMES = new Set([
  'page_view',
  'instagram_click',
  'youtube_click',
  'social_placeholder_click',
  'view_zero_to_one',
  'view_right_now',
  'view_whats_next',
  'scroll_25',
  'scroll_50',
  'scroll_75',
  'scroll_90',
  'resource_view',
  'resource_cta_click',
  'resource_download',
  'resource_tool_use',
  'email_signup',
  'product_view',
  'shop_click',
  'checkout_start',
  'purchase'
]);

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers
    }
  });
}

export function text(value, max = 200) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export function cleanPath(value) {
  const path = text(value, 300);
  return path.startsWith('/') && !path.startsWith('//') ? path : '/';
}

export function sourceFrom(referrer, utmSource) {
  const value = `${utmSource || ''} ${referrer || ''}`.toLowerCase();
  if (value.includes('instagram')) return 'Instagram';
  if (value.includes('google')) return 'Google';
  if (value.includes('youtube') || value.includes('youtu.be')) return 'YouTube';
  return value.trim() ? 'Other' : 'Direct';
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
  return Uint8Array.from(decoded, char => char.charCodeAt(0));
}

function decodeJson(value) {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value)));
}

export async function verifyAccess(request, env) {
  const token = request.headers.get('Cf-Access-Jwt-Assertion') || '';
  const teamDomain = text(env.CF_ACCESS_TEAM_DOMAIN, 250).replace(/\/$/, '');
  const audience = text(env.CF_ACCESS_AUD, 200);
  if (!teamDomain || !audience) return { ok: false, status: 503, reason: 'Cloudflare Access 尚未完成設定。' };
  if (!token) return { ok: false, status: 401, reason: '需要通過 Cloudflare Access 登入。' };

  try {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
    if (!encodedHeader || !encodedPayload || !encodedSignature) throw new Error('token');
    const header = decodeJson(encodedHeader);
    const payload = decodeJson(encodedPayload);
    if (header.alg !== 'RS256' || !header.kid) throw new Error('algorithm');
    const certResponse = await fetch(`${teamDomain}/cdn-cgi/access/certs`, { cf: { cacheTtl: 3600, cacheEverything: true } });
    if (!certResponse.ok) throw new Error('certs');
    const certs = await certResponse.json();
    const jwk = certs.keys?.find(key => key.kid === header.kid);
    if (!jwk) throw new Error('key');
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      decodeBase64Url(encodedSignature),
      new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
    );
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    const now = Math.floor(Date.now() / 1000);
    const issuer = teamDomain;
    if (!valid || !audiences.includes(audience) || payload.iss !== issuer || payload.exp <= now) throw new Error('claims');
    return { ok: true, payload };
  } catch (_) {
    return { ok: false, status: 401, reason: 'Cloudflare Access 驗證失敗。' };
  }
}
