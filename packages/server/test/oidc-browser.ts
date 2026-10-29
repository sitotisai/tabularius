/** A cookie jar for the OIDC HTTP tests, whose local endpoints stand in for the browser/TLS proxy.
 * Only cookies actually issued by a start response are sent; a made-up callback gets no invented proof.
 */
export function oidcBrowser() {
  const cookies = new Map<string, string>();
  return async (input: string, init: RequestInit = {}): Promise<Response> => {
    const url = new URL(input);
    const headers = new Headers(init.headers);
    if (url.pathname === '/tabularius/auth/v1/oidc/callback') {
      const held = [...cookies].filter(([key]) => key.startsWith(url.hostname + '\0')).map(([, value]) => value);
      if (held.length) headers.set('cookie', [headers.get('cookie'), ...held].filter(Boolean).join('; '));
    }
    const response = await globalThis.fetch(input, { ...init, headers });
    for (const value of response.headers.getSetCookie()) {
      const pair = value.split(';')[0];
      if (!pair.includes('tabularius_oidc_')) continue;
      const key = url.hostname + '\0' + pair.split('=')[0];
      if (/Max-Age=0(?:;|$)/.test(value)) cookies.delete(key); else cookies.set(key, pair);
    }
    return response;
  };
}
