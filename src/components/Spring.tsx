
import React from 'react';

interface SpringProps {
  type: string;
  index: number;
  children: React.ReactNode;
}

const Spring: React.FC<SpringProps> = ({ children, type, index }) => {
  // Simple implementation that just renders children
  // In a real app, this would likely include animation logic
  return <div data-spring-type={type} data-index={index}>{children}</div>;
};

export default Spring;
