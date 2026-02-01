import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { User, Briefcase } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, userRole, setUserRole, signOut } = useAuth();
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Show role selection modal if user is logged in but hasn't selected a role
  const needsRoleSelection = user && userRole === UserRole.GUEST;

  const handleRoleSelect = (role: UserRole) => {
    setUserRole(role);
    setShowRoleModal(false);
  };

  const handleLogout = async () => {
    await signOut();
  };

  // Effect to show role modal when needed
  React.useEffect(() => {
    if (needsRoleSelection) {
      setShowRoleModal(true);
    }
  }, [needsRoleSelection]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Header 
        role={userRole} 
        onLogout={handleLogout} 
        isLoggedIn={!!user}
      />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Outlet context={{ role: userRole, setRole: setUserRole }} />
      </main>
      
      <Footer />

      {/* Role Selection Modal - shows when user needs to pick a role */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Choose Your Role</h2>
                <p className="text-gray-500 mt-2">How will you use FixItHub?</p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => handleRoleSelect(UserRole.CUSTOMER)}
                  className="w-full p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group flex items-center gap-4 text-left"
                >
                  <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <User className="text-blue-600 w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">I'm a Customer</h3>
                    <p className="text-sm text-gray-500">I need tools or services for my home</p>
                  </div>
                </button>

                <button
                  onClick={() => handleRoleSelect(UserRole.PROFESSIONAL)}
                  className="w-full p-4 border border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all group flex items-center gap-4 text-left"
                >
                  <div className="bg-orange-100 p-3 rounded-lg group-hover:bg-orange-200 transition-colors">
                    <Briefcase className="text-orange-600 w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">I'm a Professional</h3>
                    <p className="text-sm text-gray-500">I want to find jobs and buy gear</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
