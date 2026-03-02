import { UserLogin } from '@/components/login/userLogin';
import serhafenNewImage from '@/assets/serhafen_new.png';
import serhafenLogo from '@/assets/SERHAFEN_BLANCO.svg';

const Login = () => {
  return (
    <section data-testid='login-container' className='flex h-screen'>
      <div className='flex-1 flex p-1 relative'>
        <img
          src={serhafenNewImage}
          alt='Serhafen'
          className='max-h-[calc(100vh-0.5rem)] w-auto object-contain rounded-md'
        />
        <div className='absolute inset-0 flex flex-col justify-between p-4'>
          <div className='flex justify-start'>
            <img src={serhafenLogo} alt='Logo' className='h-8 w-auto' />
          </div>
          <div className='w-1/2 flex flex-col justify-center align-center gap-2 mb-3'>
            <p className='text-white italic font-sans text-sm'>
              Nuestras conexiones internacionales nos ayudan a enviar productos
              de un país a otros en menos de 72 hrs.
            </p>
            <p className='text-white text-lg font-sans text-sm'>
              Envíos Internacionales
            </p>
          </div>
        </div>
      </div>
      <div className='flex-1 flex items-center justify-center'>
        <UserLogin />
      </div>
    </section>
  );
};

export default Login;
