import React, { useState } from 'react';
import MainApp from 'components/MainApp';
import LoginScreen from 'components/Login';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return <MainApp />;
}

