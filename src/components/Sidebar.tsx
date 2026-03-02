import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  // Bell,
  // Settings,
  LogOut,
  PanelRightOpen,
  PanelRightClose,
  User,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import serhafenLogo from '@/assets/serhafen_main-logo.png';

interface SidebarProps {
  className?: string;
}

interface NavItem {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  href?: string;
  section?: 'general' | 'account';
}

const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const { logout, getUserInfo } = useAuthStore();

  const userInfo = getUserInfo();
  const { t } = useTranslation();

  const generalNavItems: NavItem[] = [
    {
      icon: LayoutDashboard,
      label: t('sidebar.navigation.erp'),
      href: '/erp',
    },
  ];

  // const accountNavItems: NavItem[] = [
  //   {
  //     icon: Bell,
  //     label: t('sidebar.navigation.notifications'),
  //     href: '/notifications',
  //   },
  //   {
  //     icon: Settings,
  //     label: t('sidebar.navigation.settings'),
  //     href: '/settings',
  //   },
  // ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const renderNavItem = (item: NavItem, index: number) => {
    const IconComponent = item.icon;

    return (
      <li key={index}>
        <NavLink
          to={item.href || '#'}
          className={({ isActive }) => `
            flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg
            ${isCollapsed ? 'justify-center' : ''}
            ${isActive ? 'text-black' : ''}
          `}
        >
          {({ isActive }) => (
            <>
              <IconComponent
                className='w-5 h-5 flex-shrink-0'
                strokeWidth={1}
              />
              {!isCollapsed && (
                <span
                  className={`text-sm transition-all duration-200 ${isActive ? 'font-bold' : 'font-medium'}`}
                >
                  {item.label}
                </span>
              )}
            </>
          )}
        </NavLink>
      </li>
    );
  };

  return (
    <div
      className={`
        ${isCollapsed ? 'w-16' : 'w-66'} 
        h-screen bg-white border-r border-gray-200 flex flex-col
        transition-all duration-300 ease-in-out
        ${className}
      `}
    >
      <div className='flex items-center justify-between p-4 border-b border-gray-200'>
        {!isCollapsed && (
          <div className='flex items-center'>
            {/* <img
              src={serhafenLogo}
              alt='serhafen Ecosystem'
              className='h-8 w-auto'
            /> */}
            <h1 className='bold'>ERP</h1>
          </div>
        )}

        <button
          onClick={toggleSidebar}
          className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
        >
          {isCollapsed ? (
            <PanelRightClose className='w-5 h-5' strokeWidth={1} />
          ) : (
            <PanelRightOpen className='w-5 h-5' strokeWidth={1} />
          )}
        </button>
      </div>

      <nav className='flex-1 flex flex-col px-2 py-4 overflow-y-auto'>
        <div className='mb-6'>
          {!isCollapsed && (
            <h3 className='px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider'>
              {t('sidebar.sections.general')}
            </h3>
          )}
          <ul className='space-y-1'>
            {generalNavItems.map((item, index) => renderNavItem(item, index))}
          </ul>
        </div>

        <div className='mt-auto'>
          {/* {!isCollapsed && (
            <h3 className='px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider'>
              {t('sidebar.sections.account')}
            </h3>
          )} */}
          {/* <ul className='space-y-1'>
            {accountNavItems.map((item, index) => renderNavItem(item, index))}
          </ul> */}
          <div className='mt-4 pt-4 border-t border-gray-200'>
            {!isCollapsed && userInfo && (
              <div className='px-4 py-2 mb-2'>
                <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center'>
                    <User className='w-4 h-4' strokeWidth={1} />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium text-gray-900 truncate'>
                      {userInfo.name}
                    </p>
                    <p className='text-xs text-gray-500 truncate'>
                      {userInfo.email}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`
                flex items-center gap-3 px-4 py-3 w-full text-gray-700 rounded-lg
                hover:bg-red-50 hover:text-red-600 transition-colors duration-200
                ${isCollapsed ? 'justify-center' : ''}
              `}
            >
              <LogOut className='w-5 h-5 flex-shrink-0' strokeWidth={1} />
              {!isCollapsed && (
                <span className='text-sm font-medium'>
                  {t('sidebar.navigation.logout')}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
