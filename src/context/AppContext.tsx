import React, { createContext, useState, useContext, ReactNode } from 'react';
import { ScheduleEntry, scheduleData as initialScheduleData, initialTimeSlots } from '@/data/schedule';

type Role = 'admin' | 'user';

interface AppContextType {
  role: Role;
  setRole: (role: Role) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  schedule: ScheduleEntry[];
  updateSchedule: (entry: ScheduleEntry) => void;
  deleteSchedule: (entry: ScheduleEntry) => void;
  timeSlots: string[];
  addTimeSlot: (timeSlot: string) => void;
  updateTimeSlot: (oldTimeSlot: string, newTimeSlot: string) => void;
  deleteTimeSlot: (timeSlot: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<Role>('admin');
  const [isLoading, setIsLoading] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>(initialScheduleData);
  const [timeSlots, setTimeSlots] = useState<string[]>(initialTimeSlots);

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

  const value = { role, setRole, isLoading, setIsLoading, schedule, updateSchedule, deleteSchedule, timeSlots, addTimeSlot, updateTimeSlot, deleteTimeSlot };

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
