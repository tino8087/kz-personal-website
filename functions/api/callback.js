function readCookie(request, name) {
  const cookies = request.headers.get("Cookie") || "";
  const item = cookies
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return item ? item.slice(name.length + 1) : "";
}

function renderResult(status, content) {
  const payload = JSON.stringify(content).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="zh-Hant">
<head><meta charset="utf-8"><title>KZ CMS Login</title></head>
<body>
<p>登入處理中，完成後此視窗會自動關閉。</p>
<script>
  const receiveMessage = (message) => {
    if (message.source !== window.opener) return;
    window.opener.postMessage('authorization:github:${status}:' + ${JSON.stringify(payload)}, message.origin);
    window.removeEventListener('message', receiveMessage);
  };
  window.addEventListener('message', receiveMessage);
  window.opener.postMessage('authorizing:github', '*');
</script>
</body>
</html>`;
}

export async function onRequest({ request, env }) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const expectedState = readCookie(request, "kz_oauth_state");

  if (!code || !state || !expectedState || state !== expectedState) {
    return new Response(renderResult("error", { message: "Invalid OAuth state" }), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=UTF-8", "Cache-Control": "no-store" },
    });
  }

  const githubResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "kz-personal-website-decap-cms",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${requestUrl.origin}/api/callback`,
    }),
  });
  const result = await githubResponse.json();

  if (!githubResponse.ok || result.error || !result.access_token) {
    return new Response(renderResult("error", result), {
      status: 401,
      headers: { "Content-Type": "text/html; charset=UTF-8", "Cache-Control": "no-store" },
    });
  }

  return new Response(renderResult("success", { token: result.access_token, provider: "github" }), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": "no-store",
      "Set-Cookie": "kz_oauth_state=; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    },
  });
}
