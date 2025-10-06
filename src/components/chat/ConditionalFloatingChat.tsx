import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FloatingChat } from './FloatingChat';

const ConditionalFloatingChat: React.FC = () => {
  const { user } = useAuth();
  
  // Only show floating chat for non-admin users
  if (user?.role === 'Admin') {
    return null;
  }
  
  return <FloatingChat />;
};

export default ConditionalFloatingChat;


