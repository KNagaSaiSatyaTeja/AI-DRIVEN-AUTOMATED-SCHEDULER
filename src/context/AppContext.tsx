
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { ScheduleEntry, TimetableConfig, SubjectConfig, FacultyConfig, initialTimeSlots, configDays, CollegeTime, BreakConfig, FacultyAvailability } from '@/data/schedule';
import axios, { AxiosError } from 'axios';

// Import types from backend models (assumed based on previous response)
interface RoomSchedule {
  room: string;
  schedule: ScheduleEntry[];
}

interface Timetable {
  _id: string;
  subjects: string[]; // Array of subject IDs
  breaks: BreakConfig[];
  collegeTime: CollegeTime;
  rooms: string[]; // Array of room IDs
  schedule: ScheduleEntry[];
  roomWiseSchedules: RoomSchedule[];
  createdAt: Date;
  updatedAt: Date;
}

type Role = 'admin' | 'user';

interface AppContextType {
  role: Role | null;
  token: string | null;
  setRole: (role: Role | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  selectedRoom: string | null;
  setSelectedRoom: (roomId: string | null) => void;
  generateSchedule: (payload: TimetableConfig) => Promise<{ success: boolean; message: string }>;
  getTimetables: (roomId?: string) => Promise<Timetable[]>;
  createTimetable: (roomId: string, data: TimetableConfig) => Promise<Timetable>;
  updateTimetable: (roomId: string, id: string, data: TimetableConfig) => Promise<Timetable>;
  timetables: Timetable[];
  schedule: ScheduleEntry[];
  timeSlots: string[];
  updateSchedule: (entry: ScheduleEntry) => void;
  deleteSchedule: (entry: ScheduleEntry) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000/api';

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRoleState] = useState<Role | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [timeSlots] = useState<string[]>(initialTimeSlots);
  const [timetables, setTimetables] = useState<Timetable[]>([]);

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role') as Role | null;
    
    if (storedToken && storedRole) {
      setTokenState(storedToken);
      setRoleState(storedRole);
    }
  }, []);

  // Create axios instance with token
  const createAuthenticatedAxios = () => {
    return axios.create({
      baseURL: API_BASE_URL,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  };

  const setRole = (newRole: Role | null) => {
    setRoleState(newRole);
    if (newRole) {
      localStorage.setItem('role', newRole);
    } else {
      localStorage.removeItem('role');
    }
  };

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
    }
  };

  const logout = () => {
    setRoleState(null);
    setTokenState(null);
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    // Clear other unnecessary data
    localStorage.clear();
  };

  const getTimetables = async (roomId?: string): Promise<Timetable[]> => {
    try {
      const api = createAuthenticatedAxios();
      const response = await api.get<Timetable[]>(roomId ? `/timetable/room/${roomId}` : '/timetable');
      setTimetables(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching timetables:', error);
      return [];
    }
  };

  const createTimetable = async (roomId: string, data: TimetableConfig): Promise<Timetable> => {
    try {
      const api = createAuthenticatedAxios();
      const response = await api.post<Timetable>(`/timetable/room/${roomId}/generate`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating timetable:', error);
      throw error;
    }
  };

  const updateTimetable = async (roomId: string, id: string, data: TimetableConfig): Promise<Timetable> => {
    try {
      const api = createAuthenticatedAxios();
      const response = await api.put<Timetable>(`/timetable/room/${roomId}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating timetable:', error);
      throw error;
    }
  };

  const generateSchedule = async (payload: TimetableConfig): Promise<{ success: boolean; message: string }> => {
    console.log("Sending payload for timetable generation:", JSON.stringify(payload, null, 2));
    if (!selectedRoom) throw new Error('No room selected');
    setIsLoading(true);

    try {
      const response = await createTimetable(selectedRoom, payload);
      await getTimetables(selectedRoom);
      setIsLoading(false);
      return { success: true, message: 'New timetable generated successfully!' };
    } catch (error) {
      console.error("Failed to generate timetable:", error);
      setIsLoading(false);
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.message || error.message || 'Unknown server error';
        return { success: false, message: `Generation failed: ${errorMessage}` };
      }
      return { success: false, message: 'An unexpected error occurred while generating the timetable.' };
    }
  };

  const updateSchedule = (entry: ScheduleEntry) => {
    setSchedule(prev => {
      const existingIndex = prev.findIndex(
        e => e.day === entry.day && e.time === entry.time && e.room === entry.room
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = entry;
        return updated;
      } else {
        return [...prev, entry];
      }
    });
  };

  const deleteSchedule = (entry: ScheduleEntry) => {
    setSchedule(prev => 
      prev.filter(e => !(e.day === entry.day && e.time === entry.time && e.room === entry.room))
    );
  };

  useEffect(() => {
    if (selectedRoom && token) {
      getTimetables(selectedRoom);
    }
  }, [selectedRoom, token]);

  const value = { 
    role, 
    token,
    setRole, 
    setToken,
    logout, 
    isLoading, 
    setIsLoading, 
    selectedRoom, 
    setSelectedRoom,
    generateSchedule,
    getTimetables,
    createTimetable,
    updateTimetable,
    timetables,
    schedule,
    timeSlots,
    updateSchedule,
    deleteSchedule
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
