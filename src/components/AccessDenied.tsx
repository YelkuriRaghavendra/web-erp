import { ShieldX, Lock, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface AccessDeniedProps {
  message?: string;
  showContactAdmin?: boolean;
  onGoBack?: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  message,
  showContactAdmin = true,
  onGoBack,
}) => {
  const { t } = useTranslation();

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div className='flex items-center justify-center min-h-[60vh] p-6'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100'>
            <ShieldX className='h-8 w-8 text-red-600' />
          </div>
          <CardTitle className='text-xl font-semibold text-gray-900'>
            {t('accessDenied.title', 'Access Denied')}
          </CardTitle>
          <CardDescription className='text-gray-600'>
            {message ||
              t(
                'accessDenied.message',
                "You don't have permission to access this resource"
              )}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-center space-x-2 text-sm text-gray-500'>
            <Lock className='h-4 w-4' />
            <span>
              {t(
                'accessDenied.insufficientPermissions',
                'Insufficient permissions'
              )}
            </span>
          </div>

          {showContactAdmin && (
            <div className='flex items-center justify-center space-x-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg'>
              <AlertTriangle className='h-4 w-4' />
              <span>
                {t(
                  'accessDenied.contactAdmin',
                  'Contact your administrator for access'
                )}
              </span>
            </div>
          )}

          <div className='pt-4'>
            <Button onClick={handleGoBack} variant='outline' className='w-full'>
              {t('accessDenied.goBack', 'Go Back')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
