import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Target, BarChart3, Radio, User } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Target, label: 'CNS Tap Index', path: '/cns-tap-index' },
  { icon: BarChart3, label: 'Stats', path: '/stats' },
  { icon: Radio, label: 'Live Sensor', path: '/live-sensor' },
  { icon: User, label: 'Account', path: '/account' },
];

export function FloatingNav() {
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <motion.nav
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="fixed right-4 top-1/2 -translate-y-1/2 z-50"
    >
      <div className="bg-primary rounded-full py-4 px-3 shadow-xl flex flex-col gap-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <div key={item.path} className="relative">
              <NavLink
                to={item.path}
                onMouseEnter={() => setHoveredItem(item.path)}
                onMouseLeave={() => setHoveredItem(null)}
                className="block"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300",
                    isActive
                      ? "bg-secondary text-primary shadow-glow-primary"
                      : "bg-secondary/20 text-secondary hover:bg-secondary/40"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>
              </NavLink>

              {/* Tooltip */}
              <AnimatePresence>
                {hoveredItem === item.path && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap"
                  >
                    <div className="bg-secondary text-primary px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                      {item.label}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.nav>
  );
}
