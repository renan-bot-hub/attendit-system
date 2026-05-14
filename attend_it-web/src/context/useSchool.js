import { useContext } from 'react';
import { SchoolContext } from './SchoolContext';

// Hook to read school settings (school name, type, thresholds, etc.)
export const useSchool = () => useContext(SchoolContext);
