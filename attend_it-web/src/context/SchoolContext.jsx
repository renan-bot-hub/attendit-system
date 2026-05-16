// Loads the school settings doc once and shares it (plus a refresh()
// callback) with every page via context.

import { createContext, useEffect, useState } from 'react';
import { settingsService } from '../services/settingsService';

// eslint-disable-next-line react-refresh/only-export-components
export const SchoolContext = createContext(null);

export function SchoolProvider({ children }) {
  const [settings, setSettings] = useState({
    schoolName: 'My School',
    schoolType: 'public',
    academicYear: '2025-2026',
    lateCutoffTime: '07:30',
    autoAbsentTime: '17:00',
    consecutiveAbsenceThreshold: 3,
    warningTotalAbsences: 3,
    criticalTotalAbsences: 5,
    attendanceCriticalBelow: 75,
    attendanceHighRiskBelow: 85,
    attendanceModerateBelow: 92,
  });
  const [loading, setLoading] = useState(true);

  // Re-fetches settings from the backend (called on mount and after admin saves)
  const refresh = async () => {
    try {
      const res = await settingsService.get();
      setSettings(res.data);
    } catch {
      // Backend unreachable — keep defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
     
  }, []);

  return (
    <SchoolContext.Provider value={{ settings, loading, refresh, setSettings }}>
      {children}
    </SchoolContext.Provider>
  );
}
