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
  generateSchedule: (config: TimetableConfig) => { success: boolean, message: string };
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

  const generateSchedule = (config: TimetableConfig): { success: boolean; message: string } => {
    const newSchedule: ScheduleEntry[] = [];

    // A simple greedy algorithm to generate a schedule
    const classesToSchedule: { subject: SubjectConfig, uid: string }[] = [];
    config.subjects.forEach(subject => {
        for (let i = 0; i < subject.no_of_classes_per_week; i++) {
            classesToSchedule.push({ subject, uid: `${subject.id}-${i}` });
        }
    });

    // Add breaks first
    config.breaks.forEach(breakItem => {
        const breakDays = breakItem.day === 'ALL_DAYS' ? days : [days.find(d => d.toUpperCase() === breakItem.day)];
        const breakSlots = timeSlots.filter(ts => {
            const [start] = ts.split(' - ');
            return start >= breakItem.startTime && start < breakItem.endTime;
        });
        breakDays.forEach(day => {
            if(day) {
                breakSlots.forEach(time => {
                    config.rooms.forEach(room => {
                        newSchedule.push({ day, time, room, subject: 'Break', faculty: '', class: '' });
                    });
                });
            }
        });
    });

    const isSlotTaken = (day: string, time: string, room: string) => 
        newSchedule.some(e => e.day === day && e.time === time && e.room === room);

    const isFacultyBusy = (day: string, time: string, facultyName: string) =>
        newSchedule.some(e => e.day === day && e.time === time && e.faculty === facultyName);
    
    // Shuffle classes to get different results each time
    classesToSchedule.sort(() => Math.random() - 0.5);

    for (const day of days) {
        for (const time of timeSlots) {
            for (const room of config.rooms) {
                if (isSlotTaken(day, time, room)) continue;
                if (classesToSchedule.length === 0) break;

                const classIndex = classesToSchedule.findIndex(c => {
                    return c.subject.facultyIds.some((facultyId: string) => {
                        const faculty = config.faculty.find(f => f.id === facultyId);
                        if (!faculty) return false;

                        const isAvailable = faculty.availability.some(a => {
                            const dayMatch = a.day === day.toUpperCase();
                            if (!dayMatch) return false;
                            const slotStart = time.split(' - ')[0];
                            const slotEnd = time.split(' - ')[1];
                            return slotStart >= a.startTime && slotEnd <= a.endTime;
                        });

                        return isAvailable && !isFacultyBusy(day, time, faculty.name);
                    });
                });

                if (classIndex > -1) {
                    const classToSchedule = classesToSchedule[classIndex];
                    const availableFaculty = config.faculty.find(f => 
                        classToSchedule.subject.facultyIds.includes(f.id) && 
                        !isFacultyBusy(day, time, f.name) &&
                        f.availability.some(a => a.day === day.toUpperCase() && time.split(' - ')[0] >= a.startTime && time.split(' - ')[1] <= a.endTime)
                    );
                    
                    if (availableFaculty) {
                        newSchedule.push({
                            day,
                            time,
                            room,
                            subject: classToSchedule.subject.name,
                            faculty: availableFaculty.name,
                            class: "TBD"
                        });
                        classesToSchedule.splice(classIndex, 1);
                    }
                }
            }
            if (classesToSchedule.length === 0) break;
        }
        if (classesToSchedule.length === 0) break;
    }

    setSchedule(newSchedule);

    if (classesToSchedule.length > 0) {
        const message = `Could not schedule all classes. ${classesToSchedule.length} classes remain unscheduled.`;
        return { success: false, message };
    }
    
    return { success: true, message: 'New timetable generated successfully!' };
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
