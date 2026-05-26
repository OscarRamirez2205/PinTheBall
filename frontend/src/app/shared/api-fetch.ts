export interface ApiFetchHttpError {
  status: number;
  error: unknown;
}

function getAuthToken(): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  return localStorage.getItem('ptb_auth_token');
}

export async function apiFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  const authToken = getAuthToken();

  if (authToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...init, headers });
  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  const payload =
    response.status === 204
      ? null
      : isJson
        ? await response.json().catch(() => null)
        : await response.text().catch(() => null);

  if (!response.ok) {
    const errorBody =
      payload && typeof payload === 'object'
        ? payload
        : { message: typeof payload === 'string' ? payload : `HTTP ${response.status}` };
    throw {
      status: response.status,
      error: errorBody,
    } as ApiFetchHttpError;
  }

  return payload as T;
}
