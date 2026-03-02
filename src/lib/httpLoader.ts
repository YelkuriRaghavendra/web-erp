import { create } from 'zustand';

interface HttpLoaderState {
  isLoading: boolean;
  activeRequests: number;
  startLoading: () => void;
  stopLoading: () => void;
}

export const useHttpLoaderStore = create<HttpLoaderState>(set => ({
  isLoading: false,
  activeRequests: 0,
  startLoading: () =>
    set(state => {
      const newActiveRequests = state.activeRequests + 1;
      return {
        activeRequests: newActiveRequests,
        isLoading: newActiveRequests > 0,
      };
    }),
  stopLoading: () =>
    set(state => {
      const newActiveRequests = Math.max(0, state.activeRequests - 1);
      return {
        activeRequests: newActiveRequests,
        isLoading: newActiveRequests > 0,
      };
    }),
}));

export const httpLoader = {
  start: () => useHttpLoaderStore.getState().startLoading(),
  stop: () => useHttpLoaderStore.getState().stopLoading(),
  isLoading: () => useHttpLoaderStore.getState().isLoading,
};
