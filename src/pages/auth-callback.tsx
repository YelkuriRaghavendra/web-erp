import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui/card';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithGoogleCallback, isLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (errorParam) {
      setError(errorDescription || errorParam);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
      return;
    }

    if (!code) {
      setError('Authorization code not found');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
      return;
    }

    // Exchange code for tokens
    const handleCallback = async () => {
      try {
        if (hasFetched.current) return;
        hasFetched.current = true;
        await loginWithGoogleCallback(code);
        navigate('/', { replace: true });
      } catch (err) {
        console.error('OAuth callback failed:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    };

    handleCallback();
  }, [navigate, loginWithGoogleCallback]);

  return (
    <div className='flex items-center justify-center min-h-screen bg-gray-50'>
      <Card className='w-full max-w-md'>
        <CardContent className='pt-6 pb-6'>
          {error ? (
            <div className='text-center'>
              <div className='mb-4 text-red-600 font-medium'>
                Authentication Failed
              </div>
              <p className='text-sm text-gray-600 mb-4'>{error}</p>
              <p className='text-xs text-gray-500'>
                Redirecting to login page...
              </p>
            </div>
          ) : (
            <div className='text-center'>
              <div className='mb-4'>
                <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
              </div>
              <p className='text-gray-600'>
                {isLoading
                  ? 'Completing sign in...'
                  : 'Processing authentication...'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
