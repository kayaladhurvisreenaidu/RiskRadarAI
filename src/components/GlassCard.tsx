import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  premium?: boolean;
  onClick?: () => void;
  animate?: boolean;
}

export function GlassCard({ 
  children, 
  className, 
  premium = false, 
  onClick,
  animate = true 
}: GlassCardProps) {
  const baseClasses = premium ? 'glass-card-premium' : 'glass-card';
  
  if (!animate) {
    return (
      <div 
        className={cn(baseClasses, 'p-6', className)}
        onClick={onClick}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -2,
        boxShadow: '0 8px 32px -4px rgba(43, 18, 76, 0.12), 0 12px 56px -8px rgba(43, 18, 76, 0.08)'
      }}
      transition={{ duration: 0.3 }}
      className={cn(baseClasses, 'p-6', className)}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
