import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Wrench, User, Briefcase, LogOut, Menu, X, Zap, ChevronDown, Settings } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  role: UserRole;
  onLogout: () => void;
  isLoggedIn: boolean;
}

const Header: React.FC<HeaderProps> = ({ role, onLogout, isLoggedIn }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userProfile, customerId } = useAuth();

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

  const handleLoginClick = () => {
    navigate(ROUTES.LOGIN);
  };

  // Get display name
  const displayName = userProfile?.displayName || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';

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
              {isLoggedIn && (
                <NavItem to={ROUTES.DASHBOARD} label="Dashboard" icon={Briefcase} />
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!isLoggedIn ? (
              <button
                onClick={handleLoginClick}
                className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all"
              >
                Login / Sign Up
              </button>
            ) : (
              /* Profile Dropdown */
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                    role === UserRole.PROFESSIONAL ? 'bg-orange-500' : 'bg-blue-500'
                  }`}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900 max-w-[120px] truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {role === UserRole.PROFESSIONAL ? 'Professional' : 'Customer'}
                    </p>
                  </div>
                  
                  <ChevronDown size={16} className="text-gray-400 hidden md:block" />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setProfileDropdownOpen(false)}
                    />
                    
                    {/* Menu */}
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{displayName}</p>
                        <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                        {customerId && (
                          <p className="text-xs text-blue-600 mt-1">
                            ID: #{customerId}
                          </p>
                        )}
                      </div>

                      {/* Role Badge */}
                      <div className="px-4 py-2 border-b border-gray-100">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          role === UserRole.PROFESSIONAL 
                            ? 'bg-orange-100 text-orange-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {role === UserRole.PROFESSIONAL ? (
                            <><Briefcase size={12} /> Professional</>
                          ) : (
                            <><User size={12} /> Customer</>
                          )}
                        </span>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <Link
                          to={ROUTES.DASHBOARD}
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Settings size={16} />
                          Dashboard
                        </Link>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-100 pt-1">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onLogout();
                          }}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                        >
                          <LogOut size={16} />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
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
          {isLoggedIn && <NavItem to={ROUTES.DASHBOARD} label="Dashboard" icon={Briefcase} />}
        </div>
      )}
    </nav>
  );
};

export default Header;
