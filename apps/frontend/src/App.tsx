import React from 'react';
import AppRouter from './router/AppRouter';

/**
 * Main App component - thin wrapper around router
 * All routing logic is now in AppRouter
 */
const App: React.FC = () => {
  return <AppRouter />;
};

export default App;
