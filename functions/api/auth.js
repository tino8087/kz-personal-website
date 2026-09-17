export async function onRequest({ request, env }) {
  if (!env.GITHUB_CLIENT_ID) {
    return new Response("OAuth is not configured.", { status: 503 });
  }

  const requestUrl = new URL(request.url);
  const state = crypto.randomUUID();
  const redirectUrl = new URL("https://github.com/login/oauth/authorize");
  redirectUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  redirectUrl.searchParams.set("redirect_uri", `${requestUrl.origin}/api/callback`);
  redirectUrl.searchParams.set("scope", "public_repo user");
  redirectUrl.searchParams.set("state", state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectUrl.toString(),
      "Set-Cookie": `kz_oauth_state=${state}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
      "Cache-Control": "no-store",
    },
  });
}
