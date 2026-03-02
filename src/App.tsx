import { QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useTranslation } from 'react-i18next';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import HttpTopLoader from '@/components/HttpTopLoader';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { Toaster } from '@/components/ui/sonner';
import { queryClient } from './lib/react-query';
// import Login from '@/pages/login';
import ERPHome from './ERP/ERPHome';

function App() {
  useTranslation();


  return (
    <QueryClientProvider client={queryClient}>
      <HttpTopLoader />
      <Router>
        <Routes>
          {/* <Route path='/login' element={<Login />} />
          <Route path='/auth/callback' element={<AuthCallback />} />
          <Route path='/admin-contact' element={<AdminContact />} /> */}
          <Route
            path='/*'
            element={
              <ProtectedRoute>
                <div className='flex h-screen'>
                  <Sidebar />
                  <div className='flex-1 flex flex-col overflow-hidden'>
                    <Navbar />
                    <div className='flex-1 overflow-y-auto'>
                      <Routes>
                        <Route path='/' element={<ERPHome />} />
                        <Route path='/erp' element={<ERPHome />} />
                        {/* <Route
                          path='/settings'
                          element={
                            <RoleGuard roles='SUPERADMIN'>
                              <Settings />
                            </RoleGuard>
                          }
                        /> */}
                      </Routes>
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
        {/* <ReactQueryDevtools initialIsOpen={true} /> */}
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
