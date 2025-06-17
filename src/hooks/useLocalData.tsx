
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  credits?: number;
}

export interface Faculty {
  id: string;
  name: string;
  email?: string;
  department?: string;
}

export interface Room {
  id: string;
  name: string;
  capacity?: number;
  type?: string;
}

export interface TimeSlot {
  id: string;
  time_slot: string;
  start_time?: string;
  end_time?: string;
}

export interface ScheduleEntry {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  time: string;
  room: string;
  subject?: string;
  faculty?: string;
  class?: string;
}

// Initial data
const initialSubjects: Subject[] = [
  { id: '1', name: 'Computer Science', code: 'CS101', credits: 3 },
  { id: '2', name: 'Mathematics', code: 'MATH101', credits: 4 },
  { id: '3', name: 'Physics', code: 'PHY101', credits: 3 },
  { id: '4', name: 'Chemistry', code: 'CHEM101', credits: 3 },
];

const initialFaculty: Faculty[] = [
  { id: '1', name: 'Dr. John Smith', email: 'john.smith@university.edu', department: 'Computer Science' },
  { id: '2', name: 'Prof. Jane Doe', email: 'jane.doe@university.edu', department: 'Mathematics' },
  { id: '3', name: 'Dr. Bob Wilson', email: 'bob.wilson@university.edu', department: 'Physics' },
  { id: '4', name: 'Prof. Alice Brown', email: 'alice.brown@university.edu', department: 'Chemistry' },
];

const initialRooms: Room[] = [
  { id: '1', name: 'A-101', capacity: 30, type: 'Lecture Hall' },
  { id: '2', name: 'B-202', capacity: 50, type: 'Auditorium' },
  { id: '3', name: 'C-303', capacity: 20, type: 'Laboratory' },
  { id: '4', name: 'D-404', capacity: 25, type: 'Classroom' },
];

const initialTimeSlots: TimeSlot[] = [
  { id: '1', time_slot: '9:00 AM - 10:00 AM', start_time: '09:00', end_time: '10:00' },
  { id: '2', time_slot: '10:00 AM - 11:00 AM', start_time: '10:00', end_time: '11:00' },
  { id: '3', time_slot: '11:00 AM - 12:00 PM', start_time: '11:00', end_time: '12:00' },
  { id: '4', time_slot: '2:00 PM - 3:00 PM', start_time: '14:00', end_time: '15:00' },
  { id: '5', time_slot: '3:00 PM - 4:00 PM', start_time: '15:00', end_time: '16:00' },
];

const getFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToLocalStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const useLocalData = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    setSubjects(getFromLocalStorage('timetable-subjects', initialSubjects));
    setFaculty(getFromLocalStorage('timetable-faculty', initialFaculty));
    setRooms(getFromLocalStorage('timetable-rooms', initialRooms));
    setTimeSlots(getFromLocalStorage('timetable-timeSlots', initialTimeSlots));
    setScheduleEntries(getFromLocalStorage('timetable-scheduleEntries', []));
  }, []);

  // Load user profile
  useEffect(() => {
    if (user) {
      const profiles = getFromLocalStorage<Profile[]>('timetable-profiles', []);
      let userProfile = profiles.find(p => p.id === user.id);
      
      if (!userProfile) {
        userProfile = {
          id: user.id,
          email: user.email || '',
          role: 'user'
        };
        profiles.push(userProfile);
        saveToLocalStorage('timetable-profiles', profiles);
      }
      
      setProfile(userProfile);
    } else {
      setProfile(null);
    }
  }, [user]);

  // Save data to localStorage when state changes
  useEffect(() => {
    saveToLocalStorage('timetable-subjects', subjects);
  }, [subjects]);

  useEffect(() => {
    saveToLocalStorage('timetable-faculty', faculty);
  }, [faculty]);

  useEffect(() => {
    saveToLocalStorage('timetable-rooms', rooms);
  }, [rooms]);

  useEffect(() => {
    saveToLocalStorage('timetable-timeSlots', timeSlots);
  }, [timeSlots]);

  useEffect(() => {
    saveToLocalStorage('timetable-scheduleEntries', scheduleEntries);
  }, [scheduleEntries]);

  // CRUD operations for schedule entries
  const addScheduleEntry = async (entry: Omit<ScheduleEntry, 'id'>) => {
    try {
      const newEntry = {
        ...entry,
        id: Date.now().toString()
      };
      
      setScheduleEntries(prev => [...prev, newEntry]);
      return { data: newEntry, error: null };
    } catch (error) {
      console.error('Error adding schedule entry:', error);
      return { data: null, error };
    }
  };

  const updateScheduleEntry = async (id: string, updates: Partial<ScheduleEntry>) => {
    try {
      const updatedEntry = { ...updates, id } as ScheduleEntry;
      
      setScheduleEntries(prev => prev.map(entry => entry.id === id ? { ...entry, ...updates } : entry));
      return { data: updatedEntry, error: null };
    } catch (error) {
      console.error('Error updating schedule entry:', error);
      return { data: null, error };
    }
  };

  const deleteScheduleEntry = async (id: string) => {
    try {
      setScheduleEntries(prev => prev.filter(entry => entry.id !== id));
      return { error: null };
    } catch (error) {
      console.error('Error deleting schedule entry:', error);
      return { error };
    }
  };

  // CRUD operations for time slots
  const addTimeSlot = async (timeSlot: string) => {
    try {
      const newTimeSlot = {
        id: Date.now().toString(),
        time_slot: timeSlot
      };
      
      setTimeSlots(prev => [...prev, newTimeSlot]);
      return { data: newTimeSlot, error: null };
    } catch (error) {
      console.error('Error adding time slot:', error);
      return { data: null, error };
    }
  };

  const updateTimeSlot = async (id: string, timeSlot: string) => {
    try {
      const updatedTimeSlot = { id, time_slot: timeSlot };
      
      setTimeSlots(prev => prev.map(slot => slot.id === id ? { ...slot, time_slot: timeSlot } : slot));
      return { data: updatedTimeSlot, error: null };
    } catch (error) {
      console.error('Error updating time slot:', error);
      return { data: null, error };
    }
  };

  const deleteTimeSlot = async (id: string) => {
    try {
      setTimeSlots(prev => prev.filter(slot => slot.id !== id));
      // Also remove any schedule entries using this time slot
      const timeSlotToDelete = timeSlots.find(slot => slot.id === id);
      if (timeSlotToDelete) {
        setScheduleEntries(prev => prev.filter(entry => entry.time !== timeSlotToDelete.time_slot));
      }
      return { error: null };
    } catch (error) {
      console.error('Error deleting time slot:', error);
      return { error };
    }
  };

  const refetch = async () => {
    // For localStorage, we don't need to refetch as data is already in state
    return Promise.resolve();
  };

  return {
    profile,
    subjects,
    faculty,
    rooms,
    timeSlots,
    scheduleEntries,
    loading,
    addScheduleEntry,
    updateScheduleEntry,
    deleteScheduleEntry,
    addTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
    refetch
  };
};
