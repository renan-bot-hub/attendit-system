// Custom hook for reading shared school settings from SchoolContext.
import { useContext } from 'react';
import { SchoolContext } from './SchoolContext';

export const useSchool = () => useContext(SchoolContext);
