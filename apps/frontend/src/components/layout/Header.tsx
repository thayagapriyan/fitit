import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Wrench, User, Briefcase, LogOut, Menu, X, Zap } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { UserRole } from '../../types';

interface HeaderProps {
  role: UserRole;
  onLogout: () => void;
  onLoginClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ role, onLogout, onLoginClick }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const NavItem = ({ to, label, icon: Icon }: { to: string; label: string; icon: any }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        onClick={() => setMobileMenuOpen(false)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <Icon size={18} />
        {label}
      </Link>
    );
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link to={ROUTES.HOME} className="flex-shrink-0 flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Wrench className="text-white h-5 w-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-900">FixItHub</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex space-x-2">
              <NavItem to={ROUTES.HOME} label="Home" icon={Wrench} />
              <NavItem to={ROUTES.STORE} label="Store" icon={ShoppingCart} />
              <NavItem to={ROUTES.SERVICES} label="Services" icon={User} />
              <NavItem to={ROUTES.AI_ASSISTANT} label="AI Helper" icon={Zap} />
              {role !== UserRole.GUEST && (
                <NavItem to={ROUTES.DASHBOARD} label="Dashboard" icon={Briefcase} />
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {role !== UserRole.GUEST && (
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                {role === UserRole.PROFESSIONAL ? 'Pro Account' : 'Customer'}
              </div>
            )}

            {role === UserRole.GUEST ? (
              <button
                onClick={onLoginClick}
                className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all"
              >
                Login / Sign Up
              </button>
            ) : (
              <button
                onClick={onLogout}
                className="text-gray-500 hover:text-red-600 p-2 rounded-lg transition-colors"
              >
                <LogOut size={20} />
              </button>
            )}

            <button
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 p-4 space-y-2">
          <NavItem to={ROUTES.HOME} label="Home" icon={Wrench} />
          <NavItem to={ROUTES.STORE} label="Store" icon={ShoppingCart} />
          <NavItem to={ROUTES.SERVICES} label="Services" icon={User} />
          <NavItem to={ROUTES.AI_ASSISTANT} label="AI Helper" icon={Zap} />
          {role !== UserRole.GUEST && <NavItem to={ROUTES.DASHBOARD} label="Dashboard" icon={Briefcase} />}
        </div>
      )}
    </nav>
  );
};

export default Header;
