
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { ScheduleEntry, TimetableConfig, SubjectConfig, FacultyConfig } from '@/data/schedule';
import axios from 'axios';

type Role = 'admin' | 'user';

interface AppContextType {
  role: Role | null;
  setRole: (role: Role | null) => void;
  logout: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  generateSchedule: (payload: any) => Promise<{ success: boolean, message: string }>;
  // Timetable operations
  getTimetables: () => Promise<any[]>;
  createTimetable: (data: any) => Promise<any>;
  updateTimetable: (id: string, data: any) => Promise<any>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const API_BASE_URL = 'http://localhost:5000/api';

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<Role | null>('admin'); // Default to admin for now
  const [isLoading, setIsLoading] = useState(false);

  const logout = () => {
    setRole(null);
  };

  const getTimetables = async (): Promise<any[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/timetable`);
      return response.data;
    } catch (error) {
      console.error('Error fetching timetables:', error);
      return [];
    }
  };

  const createTimetable = async (data: any): Promise<any> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/timetable/generate`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating timetable:', error);
      throw error;
    }
  };

  const updateTimetable = async (id: string, data: any): Promise<any> => {
    try {
      const response = await axios.put(`${API_BASE_URL}/timetable/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating timetable:', error);
      throw error;
    }
  };

  const generateSchedule = async (payload: any): Promise<{ success: boolean; message: string }> => {
    console.log("Sending payload for timetable generation:", JSON.stringify(payload, null, 2));
    setIsLoading(true);

    try {
      const response = await createTimetable(payload);
      setIsLoading(false);
      return { success: true, message: 'New timetable generated successfully!' };
    } catch (error) {
      console.error("Failed to generate timetable:", error);
      setIsLoading(false);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message || 'Unknown server error';
        return { success: false, message: `Generation failed: ${errorMessage}` };
      }
      return { success: false, message: 'An unexpected error occurred while generating the timetable.' };
    }
  };

  const value = { 
    role, 
    setRole, 
    logout, 
    isLoading, 
    setIsLoading, 
    generateSchedule,
    getTimetables,
    createTimetable,
    updateTimetable
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
