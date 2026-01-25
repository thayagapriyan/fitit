import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import Home from '../pages/Home';
import Store from '../pages/Store';
import Services from '../pages/Services';
import Dashboard from '../pages/Dashboard';
import AIAssistantPage from '../pages/AIAssistant';
import { ROUTES } from '../constants/routes';

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path={ROUTES.STORE} element={<Store />} />
          <Route path={ROUTES.SERVICES} element={<Services />} />
          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
          <Route path={ROUTES.AI_ASSISTANT} element={<AIAssistantPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
