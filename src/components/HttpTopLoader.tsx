import { useHttpLoaderStore } from '@/lib/httpLoader';

export function HttpTopLoader() {
  const isLoading = useHttpLoaderStore(state => state.isLoading);

  if (!isLoading) return null;

  return (
    <div className='fixed top-0 left-0 right-0 z-50 pointer-events-none'>
      <div className='relative h-0.5'>
        <div className='absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-pulse' />
        <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer' />
      </div>
      <div className='absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400/50 via-purple-400/50 to-blue-400/50 blur-sm animate-pulse' />
    </div>
  );
}

export default HttpTopLoader;
