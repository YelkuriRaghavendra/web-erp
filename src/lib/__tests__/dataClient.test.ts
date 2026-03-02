import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createDataClient, ApiError } from '../dataClient';
import { httpLoader } from '../httpLoader';

const fetchMock = vi.fn();
global.fetch = fetchMock;

// Mock the httpLoader
vi.mock('../httpLoader', () => ({
  httpLoader: {
    start: vi.fn(),
    stop: vi.fn(),
  },
}));

describe('dataClient', () => {
  let client: ReturnType<typeof createDataClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    client = createDataClient();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('URL building', () => {
    it('builds relative URLs correctly', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('{}'),
      });

      await client.get('/test');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringMatching(/\/serhafen\/test$/),
        expect.any(Object)
      );
    });

    it('builds absolute URLs correctly', async () => {
      const absoluteUrl = 'https://api.example.com/test';
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('{}'),
      });

      await client.get(absoluteUrl);

      expect(fetchMock).toHaveBeenCalledWith(absoluteUrl, expect.any(Object));
    });

    it('adds query parameters correctly', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('{}'),
      });

      await client.get('/test', {
        params: { page: 1, limit: 10, search: 'test' },
      });

      const [url] = fetchMock.mock.calls[0];
      expect(url).toMatch(/\/serhafen\/test\?page=1&limit=10&search=test/);
    });

    it('filters out null and undefined query parameters', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('{}'),
      });

      await client.get('/test', {
        params: { page: 1, limit: null, search: undefined, active: true },
      });

      const [url] = fetchMock.mock.calls[0];
      expect(url).toMatch(/\/serhafen\/test\?page=1&active=true/);
    });

    it('handles custom base URL', async () => {
      const customClient = createDataClient('https://custom.api.com');
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('{}'),
      });

      await customClient.get('/test');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://custom.api.com/test',
        expect.any(Object)
      );
    });
  });

  describe('HTTP methods', () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('{"success": true}'),
      });
    });

    it('makes GET requests', async () => {
      const result = await client.get('/test');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual({ success: true });
    });

    it('makes POST requests with JSON body', async () => {
      const data = { name: 'test', value: 123 };
      const result = await client.post('/test', data);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data),
        })
      );
      expect(result).toEqual({ success: true });
    });

    it('makes PUT requests', async () => {
      const data = { id: 1, name: 'updated' };
      await client.put('/test/1', data);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('makes PATCH requests', async () => {
      const data = { name: 'patched' };
      await client.patch('/test/1', data);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({ method: 'PATCH' })
      );
    });

    it('makes DELETE requests', async () => {
      await client.delete('/test/1');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('handles FormData bodies correctly', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['test']), 'test.txt');

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('{"uploaded": true}'),
      });

      await client.post('/upload', formData);

      const [, init] = fetchMock.mock.calls[0];
      expect(init.body).toBe(formData);
      expect(init.headers).not.toHaveProperty('Content-Type');
    });
  });

  describe('Headers', () => {
    it('sets default headers', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('{}'),
      });

      await client.get('/test');

      const [, init] = fetchMock.mock.calls[0];
      expect(init.headers).toEqual(
        expect.objectContaining({
          Accept: 'application/json',
        })
      );
    });

    it('merges custom headers with defaults', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('{}'),
      });

      await client.get('/test', {
        headers: { 'X-Custom': 'value', Accept: 'text/plain' },
      });

      const [, init] = fetchMock.mock.calls[0];
      expect(init.headers).toEqual(
        expect.objectContaining({
          Accept: 'text/plain', // Custom overrides default
          'X-Custom': 'value',
        })
      );
    });

    it('sets Content-Type for JSON bodies', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('{}'),
      });

      await client.post('/test', { data: 'test' });

      const [, init] = fetchMock.mock.calls[0];
      expect(init.headers).toHaveProperty('Content-Type', 'application/json');
    });

    it('does not override explicit Content-Type', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('{}'),
      });

      await client.post(
        '/test',
        { data: 'test' },
        {
          headers: { 'Content-Type': 'application/xml' },
        }
      );

      const [, init] = fetchMock.mock.calls[0];
      expect(init.headers).toHaveProperty('Content-Type', 'application/xml');
    });
  });

  describe('Response handling', () => {
    it('parses JSON responses', async () => {
      const responseData = { id: 1, name: 'test' };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve(JSON.stringify(responseData)),
      });

      const result = await client.get('/test');

      expect(result).toEqual(responseData);
    });

    it('handles text responses', async () => {
      const textResponse = 'Plain text response';
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve(textResponse),
      });

      const result = await client.get('/test');

      expect(result).toBe(textResponse);
    });

    it('handles empty responses', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve(''),
      });

      const result = await client.get('/test');

      expect(result).toBeUndefined();
    });
  });

  describe('HTTP loader integration', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('{}'),
      });
    });

    it('calls httpLoader.start and httpLoader.stop for GET requests', async () => {
      await client.get('/test');

      expect(httpLoader.start).toHaveBeenCalledTimes(1);
      expect(httpLoader.stop).toHaveBeenCalledTimes(1);
    });

    it('calls httpLoader.start and httpLoader.stop for POST requests', async () => {
      await client.post('/test', { data: 'test' });

      expect(httpLoader.start).toHaveBeenCalledTimes(1);
      expect(httpLoader.stop).toHaveBeenCalledTimes(1);
    });

    it('calls httpLoader.start and httpLoader.stop for PUT requests', async () => {
      await client.put('/test', { data: 'test' });

      expect(httpLoader.start).toHaveBeenCalledTimes(1);
      expect(httpLoader.stop).toHaveBeenCalledTimes(1);
    });

    it('calls httpLoader.start and httpLoader.stop for PATCH requests', async () => {
      await client.patch('/test', { data: 'test' });

      expect(httpLoader.start).toHaveBeenCalledTimes(1);
      expect(httpLoader.stop).toHaveBeenCalledTimes(1);
    });

    it('calls httpLoader.start and httpLoader.stop for DELETE requests', async () => {
      await client.delete('/test');

      expect(httpLoader.start).toHaveBeenCalledTimes(1);
      expect(httpLoader.stop).toHaveBeenCalledTimes(1);
    });

    it('calls httpLoader.stop even when request fails', async () => {
      fetchMock.mockReset();
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.get('/test')).rejects.toThrow();

      expect(httpLoader.start).toHaveBeenCalledTimes(1);
      expect(httpLoader.stop).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error handling', () => {
    it('throws ApiError for HTTP errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: () => Promise.resolve('{"message": "Resource not found"}'),
      });

      await expect(client.get('/test')).rejects.toThrow(ApiError);
      await expect(client.get('/test')).rejects.toMatchObject({
        status: 404,
        message: 'Resource not found',
      });
    });

    it('uses statusText when no message in response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('{}'),
      });

      await expect(client.get('/test')).rejects.toMatchObject({
        status: 500,
        message: 'Internal Server Error',
      });
    });

    it('throws ApiError for network errors', async () => {
      const networkError = new Error('Network failure');
      fetchMock.mockRejectedValue(networkError);

      await expect(client.get('/test')).rejects.toThrow(ApiError);
      await expect(client.get('/test')).rejects.toMatchObject({
        message: 'Network failure',
      });
    });

    it('handles malformed JSON in error responses', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: () => Promise.resolve('Invalid JSON'),
      });

      await expect(client.get('/test')).rejects.toMatchObject({
        status: 400,
        message: 'Bad Request',
      });
    });
  });

  describe('Request options', () => {
    it('passes AbortSignal to fetch', async () => {
      const abortController = new AbortController();
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('{}'),
      });

      await client.get('/test', { signal: abortController.signal });

      const [, init] = fetchMock.mock.calls[0];
      expect(init.signal).toBe(abortController.signal);
    });

    it('handles baseUrl override', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('{}'),
      });

      await client.get('/test', { baseUrl: 'https://override.com' });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://override.com/test',
        expect.any(Object)
      );
    });
  });

  describe('ApiError class', () => {
    it('creates error with all properties', () => {
      const response = { status: 404 } as Response;
      const error = new ApiError(
        'Not found',
        404,
        { detail: 'error' },
        response
      );

      expect(error.name).toBe('ApiError');
      expect(error.message).toBe('Not found');
      expect(error.status).toBe(404);
      expect(error.data).toEqual({ detail: 'error' });
      expect(error.response).toBe(response);
    });

    it('creates error with minimal properties', () => {
      const error = new ApiError('Error occurred');

      expect(error.name).toBe('ApiError');
      expect(error.message).toBe('Error occurred');
      expect(error.status).toBeUndefined();
      expect(error.data).toBeUndefined();
      expect(error.response).toBeUndefined();
    });
  });
});
