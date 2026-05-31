import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LoginScreen from './components/LoginScreen';
import SystemHub from './SystemHub';
import { getCurrentUser, logout } from './services/db';

const App = () => {
  const [user, setUser] = useState(() => getCurrentUser());

  const handleLogin = (userInfo) => {
    setUser(userInfo);
  };

  const handleExit = () => {
    logout();
    setUser(null);
  };

  return (
    <AnimatePresence mode="wait">
      {!user ? (
        <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <LoginScreen onLogin={handleLogin} />
        </motion.div>
      ) : (
        <motion.div key="hub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full">
          <SystemHub onExit={handleExit} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default App;
