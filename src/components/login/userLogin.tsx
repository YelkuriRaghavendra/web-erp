import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import serhafenLogo from '@/assets/ISOTIPO_SERHAFEN_AZUL.png';
import SvgIcon, { googleLogo } from '../Icons';
import { ALLOWED_ROLES } from '@/lib/constants';
import { Separator } from '../ui/separator';
import { LogIn } from 'lucide-react';

// Extracted and Parameterized Schema for translated error messages
const createLoginSchema = (t: (key: string) => string) =>
  z.object({
    email: z
      .string()
      .email(t('validation.login.emailInvalid'))
      .refine(email => email.endsWith('@serhafen.com'), {
        message: t('validation.login.emailDomain'),
      }),
    password: z.string().min(6, t('validation.login.passwordMin')),
  });

interface LoginCardProps {
  email: string;
  password: string;
  grantType: string;
}

interface loginErrorProps {
  email?: string;
  password?: string;
}

export function UserLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError, loginWithGoogle, hasRole } =
    useAuthStore();

  // Memoize the schema to optimize performance
  const loginSchema = useMemo(() => createLoginSchema(t), [t]);

  const [errors, setErrors] = useState<loginErrorProps>({});
  const [formData, setFormData] = useState<LoginCardProps>({
    email: '',
    password: '',
    grantType: 'password',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear any existing errors when user starts typing
    if (errors[e.target.name as keyof loginErrorProps]) {
      setErrors({ ...errors, [e.target.name]: undefined });
    }
    // Clear auth error when user starts typing
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Use the memoized schema here
    const result = loginSchema.safeParse(formData);

    if (!result.success) {
      const newErrors: loginErrorProps = {};
      result.error.issues.forEach(issue => {
        newErrors[issue.path[0] as keyof loginErrorProps] = issue.message;
      });
      setErrors(newErrors);
      return;
    }

    try {
      setErrors({});
      await login(formData);
      const hasRoles = hasRole(...ALLOWED_ROLES);
      if (hasRoles) {
        const from =
          (location.state as { from?: { pathname: string } })?.from?.pathname ||
          '/mawbs';
        navigate(from, { replace: true });
      } else {
        navigate('/admin-contact', { replace: true });
      }
    } catch (err) {
      // Error is handled by the store, just log it
      console.error('Login failed:', err);
    }
  };

  return (
    <div className='flex items-center justify-start w-full'>
      <Card
        className='max-w-lg border-0 rounded-2xl w-full'
        data-testid='user-login-form'
      >
        <CardHeader className='pt-6 flex flex-col items-center'>
          <img
            src={serhafenLogo}
            alt='serhafen Ecosystem'
            className='h-12 w-auto'
          />
        </CardHeader>
        <CardHeader className='text-center'>
          <h1 className='text-2xl md:text-2xl font-bold text-primary-foreground'>
            Bienvenido de nuevo a Serhafen
          </h1>
          <p className='mt-2 text-sm md:text-base text-gray-foreground'>
            Ingresa tus datos para acceder al sistema
          </p>
        </CardHeader>

        <CardHeader className='text-center'>
          <Button
            variant='primary-blue'
            // className='cursor-not-allowed'
            disabled={isLoading}
            onClick={loginWithGoogle}
            size={'lg'}
          >
            <SvgIcon symbol={googleLogo} className='mr-2 h-4 w-4' />
            Login with Google
          </Button>
        </CardHeader>
        <CardHeader className='p-0'>
          <div className='flex items-center gap-2'>
            <Separator className='flex-1' />
            <span className='text-sm md:text-base text-gray-300'>O</span>
            <Separator className='flex-1' />
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className='flex flex-col gap-6 mt-6'>
              {error && (
                <div className='p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded'>
                  {error}
                </div>
              )}
              <div className='grid gap-2'>
                <Label htmlFor='email'>{t('loginform.email')}</Label>
                <Input
                  id='email'
                  name='email'
                  type='email'
                  placeholder={t('loginform.emailPlaceholder')}
                  required
                  onChange={handleChange}
                  disabled={isLoading}
                  className='h-11'
                />
                {errors.email && (
                  <p className='text-sm text-red-600'>{errors.email}</p>
                )}
              </div>
              <div className='grid gap-2'>
                <div className='flex items-center'>
                  <Label htmlFor='password'>{t('loginform.password')}</Label>
                </div>
                <Input
                  id='password'
                  name='password'
                  type='password'
                  placeholder={t('loginform.passwordPlaceholder')}
                  required
                  onChange={handleChange}
                  disabled={isLoading}
                  className='h-11'
                />
                {errors.password && (
                  <p className='text-sm text-red-600'>{errors.password}</p>
                )}
              </div>
              <Button variant='link' className='w-full text-sm'>
                {t('loginform.forgotpassword')}
              </Button>
              <Button
                type='submit'
                className='px-8 py-2'
                disabled={isLoading}
                variant='primary-blue'
              >
                {isLoading ? 'Loading...' : t('loginform.login')}
                <LogIn />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
