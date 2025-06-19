
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { ScheduleEntry, scheduleData as initialScheduleData, initialTimeSlots, TimetableConfig, days, SubjectConfig } from '@/data/schedule';
import axios from 'axios';

type Role = 'admin' | 'user';

interface RoomData {
  schedule: ScheduleEntry[];
  config: TimetableConfig;
  timeSlots: string[];
}

interface AppContextType {
  role: Role | null;
  setRole: (role: Role | null) => void;
  logout: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  schedule: ScheduleEntry[];
  updateSchedule: (entry: ScheduleEntry) => void;
  deleteSchedule: (entry: ScheduleEntry) => void;
  timeSlots: string[];
  addTimeSlot: (timeSlot: string) => void;
  updateTimeSlot: (oldTimeSlot: string, newTimeSlot: string) => void;
  deleteTimeSlot: (timeSlot: string) => void;
  generateSchedule: (payload: any) => Promise<{ success: boolean, message: string }>;
  saveRoomConfig: (roomId: string, config: TimetableConfig) => void;
  getRoomConfig: (roomId: string) => TimetableConfig | null;
  saveRoomData: (roomId: string, data: Partial<RoomData>) => void;
  getRoomData: (roomId: string) => RoomData | null;
  updateRoomSchedule: (roomId: string, entry: ScheduleEntry) => void;
  deleteRoomSchedule: (roomId: string, entry: ScheduleEntry) => void;
  updateRoomTimeSlots: (roomId: string, timeSlots: string[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const ROOM_CONFIG_STORAGE_KEY = 'room_configs';
const ROOM_DATA_STORAGE_KEY = 'room_data';

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>(initialScheduleData);
  const [timeSlots, setTimeSlots] = useState<string[]>(initialTimeSlots);

  const logout = () => {
    setRole(null);
  };

  // Legacy methods for backward compatibility
  const updateSchedule = (entryToUpdate: ScheduleEntry) => {
    setSchedule(currentSchedule => {
      const entryIndex = currentSchedule.findIndex(
        e => e.day === entryToUpdate.day && e.time === entryToUpdate.time && e.room === entryToUpdate.room
      );

      if (entryIndex !== -1) {
        const newSchedule = [...currentSchedule];
        newSchedule[entryIndex] = entryToUpdate;
        return newSchedule;
      } else {
        return [...currentSchedule, entryToUpdate];
      }
    });
  };

  const deleteSchedule = (entryToDelete: ScheduleEntry) => {
    setSchedule(currentSchedule =>
      currentSchedule.filter(
        e => !(e.day === entryToDelete.day && e.time === entryToDelete.time && e.room === entryToDelete.room)
      )
    );
  };

  const addTimeSlot = (timeSlot: string) => {
    setTimeSlots(current => {
      if (current.includes(timeSlot)) {
        return current;
      }
      return [...current, timeSlot].sort();
    });
  };

  const updateTimeSlot = (oldTimeSlot: string, newTimeSlot: string) => {
    setTimeSlots(current =>
      current.map(ts => (ts === oldTimeSlot ? newTimeSlot : ts)).sort()
    );
    setSchedule(currentSchedule =>
      currentSchedule.map(e => (e.time === oldTimeSlot ? { ...e, time: newTimeSlot } : e))
    );
  };

  const deleteTimeSlot = (timeSlot: string) => {
    setTimeSlots(current => current.filter(ts => ts !== timeSlot));
    setSchedule(currentSchedule => currentSchedule.filter(e => e.time !== timeSlot));
  };

  // Room-wise data management
  const saveRoomData = (roomId: string, data: Partial<RoomData>) => {
    try {
      const existingData = JSON.parse(localStorage.getItem(ROOM_DATA_STORAGE_KEY) || '{}');
      const currentRoomData = existingData[roomId] || {
        schedule: [],
        config: {
          collegeTime: { startTime: "09:00", endTime: "17:00" },
          breaks: [],
          rooms: [roomId],
          subjects: [],
          faculty: []
        },
        timeSlots: initialTimeSlots
      };

      existingData[roomId] = { ...currentRoomData, ...data };
      localStorage.setItem(ROOM_DATA_STORAGE_KEY, JSON.stringify(existingData));
      console.log(`Saved data for room ${roomId}:`, existingData[roomId]);
    } catch (error) {
      console.error('Error saving room data:', error);
    }
  };

  const getRoomData = (roomId: string): RoomData | null => {
    try {
      const existingData = JSON.parse(localStorage.getItem(ROOM_DATA_STORAGE_KEY) || '{}');
      const roomData = existingData[roomId];
      console.log(`Retrieved data for room ${roomId}:`, roomData);
      return roomData || null;
    } catch (error) {
      console.error('Error retrieving room data:', error);
      return null;
    }
  };

  const updateRoomSchedule = (roomId: string, entryToUpdate: ScheduleEntry) => {
    const roomData = getRoomData(roomId);
    if (roomData) {
      const entryIndex = roomData.schedule.findIndex(
        e => e.day === entryToUpdate.day && e.time === entryToUpdate.time && e.room === entryToUpdate.room
      );

      if (entryIndex !== -1) {
        roomData.schedule[entryIndex] = entryToUpdate;
      } else {
        roomData.schedule.push(entryToUpdate);
      }
      
      saveRoomData(roomId, { schedule: roomData.schedule });
    }
  };

  const deleteRoomSchedule = (roomId: string, entryToDelete: ScheduleEntry) => {
    const roomData = getRoomData(roomId);
    if (roomData) {
      const updatedSchedule = roomData.schedule.filter(
        e => !(e.day === entryToDelete.day && e.time === entryToDelete.time && e.room === entryToDelete.room)
      );
      saveRoomData(roomId, { schedule: updatedSchedule });
    }
  };

  const updateRoomTimeSlots = (roomId: string, newTimeSlots: string[]) => {
    saveRoomData(roomId, { timeSlots: newTimeSlots });
  };

  // Legacy config methods for backward compatibility
  const saveRoomConfig = (roomId: string, config: TimetableConfig) => {
    try {
      const existingConfigs = JSON.parse(localStorage.getItem(ROOM_CONFIG_STORAGE_KEY) || '{}');
      existingConfigs[roomId] = config;
      localStorage.setItem(ROOM_CONFIG_STORAGE_KEY, JSON.stringify(existingConfigs));
      
      // Also save to new room data structure
      saveRoomData(roomId, { config });
      console.log(`Saved config for room ${roomId}:`, config);
    } catch (error) {
      console.error('Error saving room config:', error);
    }
  };

  const getRoomConfig = (roomId: string): TimetableConfig | null => {
    try {
      // First try new room data structure
      const roomData = getRoomData(roomId);
      if (roomData?.config) {
        return roomData.config;
      }

      // Fallback to legacy config storage
      const existingConfigs = JSON.parse(localStorage.getItem(ROOM_CONFIG_STORAGE_KEY) || '{}');
      const config = existingConfigs[roomId];
      console.log(`Retrieved config for room ${roomId}:`, config);
      return config || null;
    } catch (error) {
      console.error('Error retrieving room config:', error);
      return null;
    }
  };

  const generateSchedule = async (payload: any): Promise<{ success: boolean; message: string }> => {
    console.log("Sending payload for timetable generation:", JSON.stringify(payload, null, 2));
    setIsLoading(true);

    try {
        const response = await axios.post('http://127.0.0.1:8000/api/generate-schedule', payload, {
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const data = response.data;
        console.log("Received data from API:", data);

        const transformedSchedule: ScheduleEntry[] = [];
        const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';

        if (data.weekly_schedule && data.weekly_schedule.days) {
            const scheduleDays = data.weekly_schedule.days as { [key: string]: any[] };

            Object.keys(scheduleDays).forEach(dayKey => {
                const dayEntries = scheduleDays[dayKey];
                dayEntries.forEach(entry => {
                    if (entry) {
                        transformedSchedule.push({
                            day: capitalize(entry.day),
                            time: `${entry.startTime} - ${entry.endTime}`,
                            room: entry.room_id,
                            subject: entry.subject_name,
                            faculty: entry.faculty_name,
                            class: 'TBD' 
                        });
                    }
                });
            });
        }
        
        let newTimeSlots = initialTimeSlots;
        if (data.weekly_schedule && data.weekly_schedule.time_slots) {
          newTimeSlots = data.weekly_schedule.time_slots.map((ts: string) => ts.replace('-', ' - '));
          setTimeSlots(newTimeSlots);
        }
        
        setSchedule(transformedSchedule);
        
        // Save room-specific data if payload contains roomId
        if (payload.roomId) {
          saveRoomData(payload.roomId, { 
            schedule: transformedSchedule.filter(e => e.room === payload.roomId),
            timeSlots: newTimeSlots 
          });
        }
        
        setIsLoading(false);
        return { success: true, message: 'New timetable generated successfully!' };

    } catch (error) {
        console.error("Failed to fetch timetable:", error);
        setIsLoading(false);
        if (axios.isAxiosError(error)) {
            if (error.code === 'ERR_NETWORK') {
                return { success: false, message: 'Network Error: Cannot connect to the server. Please ensure the backend is running and accessible at http://127.0.0.1:8000.' };
            }
            const errorData = error.response?.data;
            const errorMessage = errorData?.detail || errorData?.message || error.message || 'Unknown server error';
            console.error("Error from generation API:", errorData);
            return { success: false, message: `Generation failed: ${errorMessage}` };
        }
        return { success: false, message: 'An unexpected error occurred while trying to connect to the generation service.' };
    }
  };

  const value = { 
    role, setRole, logout, isLoading, setIsLoading, schedule, updateSchedule, deleteSchedule, 
    timeSlots, addTimeSlot, updateTimeSlot, deleteTimeSlot, generateSchedule,
    saveRoomConfig, getRoomConfig, saveRoomData, getRoomData, updateRoomSchedule, 
    deleteRoomSchedule, updateRoomTimeSlots
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
