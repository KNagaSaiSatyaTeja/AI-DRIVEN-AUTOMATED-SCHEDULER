
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { ScheduleEntry, scheduleData as initialScheduleData, initialTimeSlots } from '@/data/schedule';
import { useAuth } from '@/hooks/useAuth';
import { useLocalData } from '@/hooks/useLocalData';
import axios from 'axios';

type Role = 'admin' | 'user';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user, signOut } = useAuth();
  const { 
    profile, 
    scheduleEntries, 
    timeSlots: dbTimeSlots, 
    addScheduleEntry, 
    updateScheduleEntry, 
    deleteScheduleEntry, 
    addTimeSlot: addDbTimeSlot,
    updateTimeSlot: updateDbTimeSlot,
    deleteTimeSlot: deleteDbTimeSlot 
  } = useLocalData();

  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fallback to localStorage for backwards compatibility
  const [localSchedule, setLocalSchedule] = useState<ScheduleEntry[]>(() => {
    const saved = localStorage.getItem('timetable-schedule');
    try {
        return saved ? JSON.parse(saved) : initialScheduleData;
    } catch {
        return initialScheduleData;
    }
  });
  
  const [localTimeSlots, setLocalTimeSlots] = useState<string[]>(() => {
    const saved = localStorage.getItem('timetable-timeSlots-legacy');
    try {
        return saved ? JSON.parse(saved) : initialTimeSlots;
    } catch {
        return initialTimeSlots;
    }
  });

  // Use local data since we're no longer using database
  const schedule = scheduleEntries.map(entry => ({
    day: entry.day,
    time: entry.time,
    room: entry.room,
    subject: entry.subject || '',
    faculty: entry.faculty || '',
    class: entry.class || ''
  }));

  const timeSlots = dbTimeSlots.map(ts => ts.time_slot);

  // Update role when profile changes
  useEffect(() => {
    if (profile) {
      setRole(profile.role);
    } else if (!user) {
      // Fallback to localStorage role when not authenticated
      const savedRole = localStorage.getItem('timetable-role');
      setRole(savedRole ? savedRole as Role : null);
    }
  }, [profile, user]);

  // Save to localStorage when not authenticated
  useEffect(() => {
    if (!user) {
      if (role) {
        localStorage.setItem('timetable-role', role);
      } else {
        localStorage.removeItem('timetable-role');
      }
    }
  }, [role, user]);

  const logout = async () => {
    if (user) {
      await signOut();
    }
    setRole(null);
  };

  const updateSchedule = async (entryToUpdate: ScheduleEntry) => {
    // Find existing entry
    const existingEntry = scheduleEntries.find(
      e => e.day === entryToUpdate.day && e.time === entryToUpdate.time && e.room === entryToUpdate.room
    );

    if (existingEntry) {
      await updateScheduleEntry(existingEntry.id, {
        subject: entryToUpdate.subject,
        faculty: entryToUpdate.faculty,
        class: entryToUpdate.class
      });
    } else {
      await addScheduleEntry({
        day: entryToUpdate.day as any,
        time: entryToUpdate.time,
        room: entryToUpdate.room,
        subject: entryToUpdate.subject,
        faculty: entryToUpdate.faculty,
        class: entryToUpdate.class
      });
    }
  };

  const deleteSchedule = async (entryToDelete: ScheduleEntry) => {
    const existingEntry = scheduleEntries.find(
      e => e.day === entryToDelete.day && e.time === entryToDelete.time && e.room === entryToDelete.room
    );
    
    if (existingEntry) {
      await deleteScheduleEntry(existingEntry.id);
    }
  };

  const addTimeSlot = async (timeSlot: string) => {
    await addDbTimeSlot(timeSlot);
  };

  const updateTimeSlot = async (oldTimeSlot: string, newTimeSlot: string) => {
    const existingSlot = dbTimeSlots.find(ts => ts.time_slot === oldTimeSlot);
    if (existingSlot) {
      await updateDbTimeSlot(existingSlot.id, newTimeSlot);
    }
  };

  const deleteTimeSlot = async (timeSlot: string) => {
    const existingSlot = dbTimeSlots.find(ts => ts.time_slot === timeSlot);
    if (existingSlot) {
      await deleteDbTimeSlot(existingSlot.id);
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
        
        if (data.weekly_schedule && data.weekly_schedule.time_slots) {
          const newTimeSlots = data.weekly_schedule.time_slots.map((ts: string) => ts.replace('-', ' - '));
          
          // Clear existing time slots and add new ones
          for (const slot of dbTimeSlots) {
            await deleteDbTimeSlot(slot.id);
          }
          for (const slot of newTimeSlots) {
            await addDbTimeSlot(slot);
          }
        }

        // Clear existing schedule and add new entries
        for (const entry of scheduleEntries) {
          await deleteScheduleEntry(entry.id);
        }
        for (const entry of transformedSchedule) {
          await addScheduleEntry({
            day: entry.day as any,
            time: entry.time,
            room: entry.room,
            subject: entry.subject,
            faculty: entry.faculty,
            class: entry.class
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

  const value = { role, setRole, logout, isLoading, setIsLoading, schedule, updateSchedule, deleteSchedule, timeSlots, addTimeSlot, updateTimeSlot, deleteTimeSlot, generateSchedule };

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
