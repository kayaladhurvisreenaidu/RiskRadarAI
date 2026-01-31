import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { FloatingNav } from './FloatingNav';

interface MainLayoutProps {
  children: ReactNode;
  darkMode?: boolean;
}

export function MainLayout({ children, darkMode = false }: MainLayoutProps) {
  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className={darkMode ? 'min-h-screen bg-terminal-bg' : 'min-h-screen bg-lilac-gradient'}>
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="pr-20 min-h-screen"
        >
          {children}
        </motion.main>
        <FloatingNav />
      </div>
    </div>
  );
}
