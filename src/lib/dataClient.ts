import { toast } from 'sonner';
import { API_BASE, HttpMethod } from './config';
import { httpLoader } from './httpLoader';
// Authentication removed

export type Params = Record<
  string,
  string | number | boolean | null | undefined
>;

export type RequestOptions = {
  baseUrl?: string;
  headers?: Record<string, string>;
  params?: Params;
  signal?: AbortSignal;
};

export class ApiError extends Error {
  status?: number;
  data?: unknown;
  response?: Response;

  constructor(
    message: string,
    status?: number,
    data?: unknown,
    response?: Response
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.response = response;
  }
}

export function createDataClient(
  baseUrl?: string,
  defaultHeaders?: Record<string, string>
) {
  const base = baseUrl ?? API_BASE ?? '/';
  const defaultHdrs = defaultHeaders ?? { Accept: 'application/json' };

  function buildUrl(path: string, params?: Params, overrideBase?: string) {
    const isAbsolute = /^https?:\/\//i.test(path);
    const b = overrideBase ?? (isAbsolute ? '' : base.replace(/\/$/, ''));
    const p = isAbsolute ? path : path.startsWith('/') ? path : `/${path}`;
    let url = isAbsolute ? path : `${b}${p}`;

    if (params && Object.keys(params).length > 0) {
      const usp = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v === null || v === undefined) continue;
        usp.append(k, String(v));
      }
      const qs = usp.toString();
      if (qs) url += (url.includes('?') ? '&' : '?') + qs;
    }

    return url;
  }

  async function handleResponse<T>(response: Response): Promise<T> {
    const text = await response.text();
    let data: unknown = undefined;
    try {
      data = text ? JSON.parse(text) : undefined;
    } catch {
      data = text;
    }

    if (!response.ok) {
      let message = response.statusText || 'Request failed';
      if (
        data &&
        typeof data === 'object' &&
        'message' in (data as Record<string, unknown>)
      ) {
        const m = (data as Record<string, unknown>).message;
        if (typeof m === 'string') message = m;
      }
      const error = new ApiError(message, response.status, data, response);

      // Show toast notification for API errors (except auth errors which are handled elsewhere)
      if (response.status !== 401 && response.status !== 403) {
        toast.error(`Error ${response.status}: ${message}`);
      }

      throw error;
    }

    return data as T;
  }

  function mergeHeaders(headers?: Record<string, string>) {
    return {
      ...defaultHdrs,
      ...(headers ?? {}),
    } as Record<string, string>;
  }

  async function request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    opts?: RequestOptions
  ): Promise<T> {
    const url = buildUrl(path, opts?.params, opts?.baseUrl);
    const headers = mergeHeaders(opts?.headers);
    // No auth headers needed

    const init: RequestInit = {
      method,
      headers,
      signal: opts?.signal,
    };

    if (body !== undefined && body !== null) {
      if (!(body instanceof FormData)) {
        headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
        init.body = JSON.stringify(body as unknown);
      } else {
        init.body = body as unknown as BodyInit;
      }
    }

    let response: Response;
    try {
      response = await fetch(url, init);

      // No token refresh needed
    } catch (err: unknown) {
      let message = 'Network request failed';
      if (
        err &&
        typeof err === 'object' &&
        'message' in (err as Record<string, unknown>)
      ) {
        const m = (err as Record<string, unknown>).message;
        if (typeof m === 'string') message = m;
      }
      const error = new ApiError(message, undefined, undefined, undefined);
      toast.error(`Network Error: ${message}`);
      throw error;
    }

    return handleResponse<T>(response);
  }

  function get<T = unknown>(path: string, opts?: RequestOptions) {
    httpLoader.start();
    return request<T>(HttpMethod.GET, path, undefined, opts).finally(() => {
      httpLoader.stop();
    });
  }

  function post<T = unknown>(
    path: string,
    body?: unknown,
    opts?: RequestOptions
  ) {
    httpLoader.start();
    return request<T>(HttpMethod.POST, path, body, opts).finally(() => {
      httpLoader.stop();
    });
  }

  function put<T = unknown>(
    path: string,
    body?: unknown,
    opts?: RequestOptions
  ) {
    httpLoader.start();
    return request<T>(HttpMethod.PUT, path, body, opts).finally(() => {
      httpLoader.stop();
    });
  }

  function patch<T = unknown>(
    path: string,
    body?: unknown,
    opts?: RequestOptions
  ) {
    httpLoader.start();
    return request<T>(HttpMethod.PATCH, path, body, opts).finally(() => {
      httpLoader.stop();
    });
  }

  function del<T = unknown>(
    path: string,
    body?: unknown,
    opts?: RequestOptions
  ) {
    httpLoader.start();
    return request<T>(HttpMethod.DELETE, path, body, opts).finally(() => {
      httpLoader.stop();
    });
  }

  return {
    get,
    post,
    put,
    patch,
    delete: del,
    request,
  } as const;
}

// Default exported instance for convenient use with React Query / Zustand
export const apiClient = createDataClient();

export default apiClient;
