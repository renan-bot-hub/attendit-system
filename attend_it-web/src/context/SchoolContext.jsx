import { createContext, useEffect, useState } from 'react';
import { settingsService } from '../services/settingsService';

// eslint-disable-next-line react-refresh/only-export-components
export const SchoolContext = createContext(null);

export function SchoolProvider({ children }) {
  const [settings, setSettings] = useState({
    schoolName: 'My School',
    schoolType: 'public',
    academicYear: '2025-2026',
    consecutiveAbsenceThreshold: 3,
    attendanceCriticalBelow: 75,
    attendanceHighRiskBelow: 85,
    attendanceModerateBelow: 92,
  });
  const [loading, setLoading] = useState(true);

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
