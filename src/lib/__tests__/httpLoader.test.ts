import { describe, it, expect, beforeEach } from 'vitest';
import { useHttpLoaderStore } from '../httpLoader';

describe('httpLoader', () => {
  beforeEach(() => {
    useHttpLoaderStore.setState({ isLoading: false, activeRequests: 0 });
  });

  it('should start loading when startLoading is called', () => {
    const { startLoading } = useHttpLoaderStore.getState();

    startLoading();

    const state = useHttpLoaderStore.getState();
    expect(state.isLoading).toBe(true);
    expect(state.activeRequests).toBe(1);
  });

  it('should stop loading when stopLoading is called', () => {
    const { startLoading, stopLoading } = useHttpLoaderStore.getState();

    startLoading();
    stopLoading();

    const state = useHttpLoaderStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.activeRequests).toBe(0);
  });

  it('should handle multiple concurrent requests', () => {
    const { startLoading, stopLoading } = useHttpLoaderStore.getState();

    startLoading();
    startLoading();
    startLoading();

    let state = useHttpLoaderStore.getState();
    expect(state.isLoading).toBe(true);
    expect(state.activeRequests).toBe(3);

    stopLoading();
    stopLoading();

    state = useHttpLoaderStore.getState();
    expect(state.isLoading).toBe(true);
    expect(state.activeRequests).toBe(1);

    stopLoading();

    state = useHttpLoaderStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.activeRequests).toBe(0);
  });

  it('should not go below zero active requests', () => {
    const { stopLoading } = useHttpLoaderStore.getState();

    stopLoading();
    stopLoading();

    const state = useHttpLoaderStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.activeRequests).toBe(0);
  });
});
