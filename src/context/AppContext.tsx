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
    const mockApiResponse = {
        "weekly_schedule": {
            "time_slots": [
                "09:00-09:50",
                "09:50-10:40",
                "10:40-11:30",
                "11:30-12:20",
                "14:00-14:50",
                "14:50-15:40",
                "15:40-16:30"
            ],
            "days": {
                "MONDAY": [
                    { "subject_name": "dasda", "faculty_id": "F1", "faculty_name": "asd", "day": "MONDAY", "startTime": "09:00", "endTime": "09:50", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "dasda", "faculty_id": "F1", "faculty_name": "asd", "day": "MONDAY", "startTime": "09:50", "endTime": "10:40", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "dasda", "faculty_id": "F1", "faculty_name": "asd", "day": "MONDAY", "startTime": "10:40", "endTime": "11:30", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "dasda", "faculty_id": "F1", "faculty_name": "asd", "day": "MONDAY", "startTime": "11:30", "endTime": "12:20", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "dasda", "faculty_id": "F1", "faculty_name": "asd", "day": "MONDAY", "startTime": "14:00", "endTime": "14:50", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "dasda", "faculty_id": "F1", "faculty_name": "asd", "day": "MONDAY", "startTime": "14:50", "endTime": "15:40", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "dasda", "faculty_id": "F1", "faculty_name": "asd", "day": "MONDAY", "startTime": "15:40", "endTime": "16:30", "room_id": "adsaas", "is_special": false, "priority_score": 0 }
                ],
                "TUESDAY": [
                    { "subject_name": "Available Slot", "faculty_id": "VF1", "faculty_name": "Virtual Faculty 1", "day": "TUESDAY", "startTime": "09:00", "endTime": "09:50", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "Available Slot", "faculty_id": "VF2", "faculty_name": "Virtual Faculty 2", "day": "TUESDAY", "startTime": "09:50", "endTime": "10:40", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "Available Slot", "faculty_id": "VF3", "faculty_name": "Virtual Faculty 3", "day": "TUESDAY", "startTime": "10:40", "endTime": "11:30", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "Available Slot", "faculty_id": "VF4", "faculty_name": "Virtual Faculty 4", "day": "TUESDAY", "startTime": "11:30", "endTime": "12:20", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "Available Slot", "faculty_id": "VF5", "faculty_name": "Virtual Faculty 5", "day": "TUESDAY", "startTime": "14:00", "endTime": "14:50", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "Available Slot", "faculty_id": "VF6", "faculty_name": "Virtual Faculty 6", "day": "TUESDAY", "startTime": "14:50", "endTime": "15:40", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "Available Slot", "faculty_id": "VF7", "faculty_name": "Virtual Faculty 7", "day": "TUESDAY", "startTime": "15:40", "endTime": "16:30", "room_id": "adsaas", "is_special": false, "priority_score": 0 }
                ],
                "WEDNESDAY": [
                    { "subject_name": "Available Slot", "faculty_id": "VF8", "faculty_name": "Virtual Faculty 8", "day": "WEDNESDAY", "startTime": "09:00", "endTime": "09:50", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "Available Slot", "faculty_id": "VF9", "faculty_name": "Virtual Faculty 9", "day": "WEDNESDAY", "startTime": "09:50", "endTime": "10:40", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "Available Slot", "faculty_id": "VF10", "faculty_name": "Virtual Faculty 10", "day": "WEDNESDAY", "startTime": "10:40", "endTime": "11:30", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "Available Slot", "faculty_id": "VF11", "faculty_name": "Virtual Faculty 11", "day": "WEDNESDAY", "startTime": "11:30", "endTime": "12:20", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "Available Slot", "faculty_id": "VF12", "faculty_name": "Virtual Faculty 12", "day": "WEDNESDAY", "startTime": "14:00", "endTime": "14:50", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "Available Slot", "faculty_id": "VF13", "faculty_name": "Virtual Faculty 13", "day": "WEDNESDAY", "startTime": "14:50", "endTime": "15:40", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "Available Slot", "faculty_id": "VF14", "faculty_name": "Virtual Faculty 14", "day": "WEDNESDAY", "startTime": "15:40", "endTime": "16:30", "room_id": "adsaas", "is_special": false, "priority_score": 0 }
                ],
                "THURSDAY": [
                    { "subject_name": "Available Slot", "faculty_id": "VF15", "faculty_name": "Virtual Faculty 15", "day": "THURSDAY", "startTime": "09:00", "endTime": "09:50", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "Available Slot", "faculty_id": "VF16", "faculty_name": "Virtual Faculty 16", "day": "THURSDAY", "startTime": "09:50", "endTime": "10:40", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "Available Slot", "faculty_id": "VF17", "faculty_name": "Virtual Faculty 17", "day": "THURSDAY", "startTime": "10:40", "endTime": "11:30", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "Available Slot", "faculty_id": "VF18", "faculty_name": "Virtual Faculty 18", "day": "THURSDAY", "startTime": "11:30", "endTime": "12:20", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "Available Slot", "faculty_id": "VF19", "faculty_name": "Virtual Faculty 19", "day": "THURSDAY", "startTime": "14:00", "endTime": "14:50", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "Available Slot", "faculty_id": "VF20", "faculty_name": "Virtual Faculty 20", "day": "THURSDAY", "startTime": "14:50", "endTime": "15:40", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "Available Slot", "faculty_id": "VF21", "faculty_name": "Virtual Faculty 21", "day": "THURSDAY", "startTime": "15:40", "endTime": "16:30", "room_id": "adsaas", "is_special": false, "priority_score": 0 }
                ],
                "FRIDAY": [
                    { "subject_name": "Available Slot", "faculty_id": "VF22", "faculty_name": "Virtual Faculty 22", "day": "FRIDAY", "startTime": "09:00", "endTime": "09:50", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "Available Slot", "faculty_id": "VF23", "faculty_name": "Virtual Faculty 23", "day": "FRIDAY", "startTime": "09:50", "endTime": "10:40", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "Available Slot", "faculty_id": "VF24", "faculty_name": "Virtual Faculty 24", "day": "FRIDAY", "startTime": "10:40", "endTime": "11:30", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "Available Slot", "faculty_id": "VF25", "faculty_name": "Virtual Faculty 25", "day": "FRIDAY", "startTime": "11:30", "endTime": "12:20", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "Available Slot", "faculty_id": "VF26", "faculty_name": "Virtual Faculty 26", "day": "FRIDAY", "startTime": "14:00", "endTime": "14:50", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "Available Slot", "faculty_id": "VF27", "faculty_name": "Virtual Faculty 27", "day": "FRIDAY", "startTime": "14:50", "endTime": "15:40", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "Available Slot", "faculty_id": "VF28", "faculty_name": "Virtual Faculty 28", "day": "FRIDAY", "startTime": "15:40", "endTime": "16:30", "room_id": "adsaas", "is_special": false, "priority_score": 0 }
                ],
                "SATURDAY": [
                    { "subject_name": "Available Slot", "faculty_id": "VF29", "faculty_name": "Virtual Faculty 29", "day": "SATURDAY", "startTime": "09:00", "endTime": "09:50", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "Available Slot", "faculty_id": "VF30", "faculty_name": "Virtual Faculty 30", "day": "SATURDAY", "startTime": "09:50", "endTime": "10:40", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "Available Slot", "faculty_id": "VF31", "faculty_name": "Virtual Faculty 31", "day": "SATURDAY", "startTime": "10:40", "endTime": "11:30", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "Available Slot", "faculty_id": "VF32", "faculty_name": "Virtual Faculty 32", "day": "SATURDAY", "startTime": "11:30", "endTime": "12:20", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "Available Slot", "faculty_id": "VF33", "faculty_name": "Virtual Faculty 33", "day": "SATURDAY", "startTime": "14:00", "endTime": "14:50", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "Available Slot", "faculty_id": "VF34", "faculty_name": "Virtual Faculty 34", "day": "SATURDAY", "startTime": "14:50", "endTime": "15:40", "room_id": "adsaas", "is_special": false, "priority_score": 0 },
                    { "subject_name": "Available Slot", "faculty_id": "VF35", "faculty_name": "Virtual Faculty 35", "day": "SATURDAY", "startTime": "15:40", "endTime": "16:30", "room_id": "adsaas", "is_special": false, "priority_score": 0 }
                ]
            }
        }
    };

    const transformedSchedule: ScheduleEntry[] = [];
    const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';

    const scheduleDays = mockApiResponse.weekly_schedule.days as { [key: string]: any[] };

    Object.keys(scheduleDays).forEach(dayKey => {
        const dayEntries = scheduleDays[dayKey];
        dayEntries.forEach(entry => {
            transformedSchedule.push({
                day: capitalize(entry.day),
                time: `${entry.startTime}-${entry.endTime}`,
                room: entry.room_id,
                subject: entry.subject_name,
                faculty: entry.faculty_name,
                class: 'TBD' 
            });
        });
    });

    setTimeSlots(mockApiResponse.weekly_schedule.time_slots);
    setSchedule(transformedSchedule);
    
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
