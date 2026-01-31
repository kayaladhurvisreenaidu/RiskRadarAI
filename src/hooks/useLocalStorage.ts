import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

// History entry type
export interface HistoryEntry {
  id: string;
  timestamp: string;
  metric: string;
  value: number | string;
  category?: string;
}

// Dashboard data type
export interface DashboardData {
  duration: number;
  rpe: number;
  dailyLoad: number;
  restingHr: number;
  hrv: number;
  sleepHours: number;
  sleepQuality: number;
  sleepScore: number;
  acwr: number;
  pastInjury: number;
  daysSinceInjury: number;
  overallRisk: number;
  knownRiskFactor: number;
}

// Profile type
export interface ProfileData {
  name: string;
  age: number;
  athleteType: string;
}

// Export JSON structure
export interface ExportData {
  athlete_id: number;
  system_date: string;
  daily_load: number;
  resting_hr: number;
  hrv: number;
  sleep_quantity: number;
  past_injury: number;
  days_since_injury: number;
}

// Hook for managing history
export function useHistory() {
  const [history, setHistory] = useLocalStorage<HistoryEntry[]>('riskradar_history', []);

  const addEntry = useCallback((entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    const newEntry: HistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    setHistory(prev => [newEntry, ...prev].slice(0, 100)); // Keep last 100 entries
    return newEntry;
  }, [setHistory]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, [setHistory]);

  return { history, addEntry, clearHistory };
}

// Hook for dashboard data
export function useDashboardData() {
  const [data, setData] = useLocalStorage<DashboardData | null>('riskradar_dashboard', null);
  return [data, setData] as const;
}

// Hook for profile
export function useProfile() {
  const [profile, setProfile] = useLocalStorage<ProfileData>('riskradar_profile', {
    name: '',
    age: 0,
    athleteType: '',
  });
  return [profile, setProfile] as const;
}

// Generate export data
export function generateExportData(dashboardData: DashboardData | null): ExportData {
  const today = new Date().toISOString().split('T')[0];
  return {
    athlete_id: 701,
    system_date: today,
    daily_load: dashboardData?.dailyLoad ?? 0,
    resting_hr: dashboardData?.restingHr ?? 0,
    hrv: dashboardData?.hrv ?? 0,
    sleep_quantity: dashboardData?.sleepScore ?? 0,
    past_injury: dashboardData?.pastInjury ?? 0,
    days_since_injury: dashboardData?.daysSinceInjury ?? 0,
  };
}
