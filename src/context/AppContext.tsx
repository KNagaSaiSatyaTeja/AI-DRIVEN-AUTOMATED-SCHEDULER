import React, { createContext, useState, useContext, ReactNode } from 'react';
import { ScheduleEntry, scheduleData as initialScheduleData, initialTimeSlots, TimetableConfig, days, SubjectConfig } from '@/data/schedule';

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
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>(initialScheduleData);
  const [timeSlots, setTimeSlots] = useState<string[]>(initialTimeSlots);

  const logout = () => {
    setRole(null);
  };

  const updateSchedule = (entryToUpdate: ScheduleEntry) => {
    setSchedule(currentSchedule => {
      const entryIndex = currentSchedule.findIndex(
        e => e.day === entryToUpdate.day && e.time === entryToUpdate.time && e.room === entryToUpdate.room
      );

      if (entryIndex !== -1) {
        // Entry exists, update it
        const newSchedule = [...currentSchedule];
        newSchedule[entryIndex] = entryToUpdate;
        return newSchedule;
      } else {
        // New entry, add it
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
    // Also update schedule entries that use this time slot
    setSchedule(currentSchedule =>
      currentSchedule.map(e => (e.time === oldTimeSlot ? { ...e, time: newTimeSlot } : e))
    );
  };

  const deleteTimeSlot = (timeSlot: string) => {
    // This will also delete schedule entries in this slot.
    setTimeSlots(current => current.filter(ts => ts !== timeSlot));
    setSchedule(currentSchedule => currentSchedule.filter(e => e.time !== timeSlot));
  };

  const generateSchedule = async (payload: any): Promise<{ success: boolean; message: string }> => {
    console.log("Sending payload for timetable generation:", JSON.stringify(payload, null, 2));
    setIsLoading(true);

    try {
        const response = await fetch('http://127.0.0.1:8000/api/generate-schedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { message: response.statusText };
            }
            console.error("Error from generation API:", errorData);
            setIsLoading(false);
            return { success: false, message: `Generation failed: ${errorData.detail || errorData.message || 'Unknown server error'}` };
        }

        const data = await response.json();
        console.log("Received data from API:", data);

        const transformedSchedule: ScheduleEntry[] = [];
        const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';

        if (data.weekly_schedule && data.weekly_schedule.days) {
            const scheduleDays = data.weekly_schedule.days as { [key: string]: any[] };

            Object.keys(scheduleDays).forEach(dayKey => {
                const dayEntries = scheduleDays[dayKey];
                dayEntries.forEach(entry => {
                    transformedSchedule.push({
                        day: capitalize(entry.day),
                        time: `${entry.startTime} - ${entry.endTime}`,
                        room: entry.room_id,
                        subject: entry.subject_name,
                        faculty: entry.faculty_name,
                        class: 'TBD' 
                    });
                });
            });
        }
        
        if (data.weekly_schedule && data.weekly_schedule.time_slots) {
          setTimeSlots(data.weekly_schedule.time_slots.map((ts: string) => ts.replace('-', ' - ')));
        }
        setSchedule(transformedSchedule);
        setIsLoading(false);
        return { success: true, message: 'New timetable generated successfully!' };

    } catch (error) {
        console.error("Failed to fetch timetable:", error);
        setIsLoading(false);
        return { success: false, message: 'Failed to connect to the schedule generation service. Please ensure it is running and accessible.' };
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
