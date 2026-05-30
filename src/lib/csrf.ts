const CSRF_COOKIE = 'pessora-csrf-token';

function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

function getOrCreateToken(): string {
  const existing = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${CSRF_COOKIE}=`))
    ?.split('=')[1];

  if (existing) return existing;

  const token = generateToken();
  document.cookie = `${CSRF_COOKIE}=${token}; SameSite=Strict; Secure; Path=/; Max-Age=86400`;
  return token;
}

export function getCsrfToken(): string {
  return getOrCreateToken();
}

export function csrfFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getCsrfToken();
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-Token': token,
    },
  });
}
