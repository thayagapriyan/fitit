import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';
import Home from '../pages/Home';
import Store from '../pages/Store';
import Services from '../pages/Services';
import Dashboard from '../pages/Dashboard';
import AIAssistantPage from '../pages/AIAssistant';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import { ROUTES } from '../constants/routes';

const AppRouter: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth routes - outside MainLayout */}
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.SIGNUP} element={<Signup />} />
          
          {/* Main app routes */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path={ROUTES.STORE} element={<Store />} />
            <Route path={ROUTES.SERVICES} element={<Services />} />
            <Route 
              path={ROUTES.DASHBOARD} 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route path={ROUTES.AI_ASSISTANT} element={<AIAssistantPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default AppRouter;
