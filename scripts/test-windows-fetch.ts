// Loaded with `node --import` by `npm run test:ci` on Windows only.
//
// A test that starts the server in its own process and then does slow synchronous work (filling a table, hashing a password,
// building a design) stops that process's event loop for longer than the server's idle keep-alive time. The server closes the
// connection `fetch` kept for the next request, `fetch` does not hear of it until the loop runs again, and the next request is
// sent on a dead socket: "fetch failed ... read ECONNRESET" on Windows (Linux and macOS usually report a clean close, which
// `fetch` retries). A person's browser or client is not blocked like this. Here every `fetch` asks the server to close the
// connection when the answer is complete, so each request opens its own; a request that sets `connection` itself is left alone.
// It changes nothing the server is asked or answers beyond that header, and nothing in a test's assertions.

type Fetch = typeof fetch;

/** Wraps `fetch` so that a request without a `connection` header asks for the connection to be closed after its answer. */
export function closingConnections(original: Fetch): Fetch {
  return function (this: unknown, input: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) {
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    if (!headers.has('connection')) headers.set('connection', 'close');
    return original.call(this, input, { ...init, headers });
  } as Fetch;
}

if (process.platform === 'win32') globalThis.fetch = closingConnections(globalThis.fetch);
