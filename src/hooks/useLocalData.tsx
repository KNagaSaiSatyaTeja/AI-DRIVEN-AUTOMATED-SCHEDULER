
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

export interface RoomData {
  subjects: { [key: string]: Subject };
  faculty: { [key: string]: Faculty };
  breaks: { [key: string]: any };
  timing: {
    startTime: string;
    endTime: string;
  };
  timetable: { [key: string]: ScheduleEntry };
}

export interface RoomWiseData {
  [roomId: string]: RoomData;
}

// Demo user profiles
const demoProfiles: Profile[] = [
  { id: 'admin-demo', email: 'admin@demo.com', role: 'admin' },
  { id: 'user-demo', email: 'user@demo.com', role: 'user' }
];

// Empty initial data - cleared as requested
const initialRoomData: RoomWiseData = {};
const initialRooms: Room[] = [];
const initialTimeSlots: TimeSlot[] = [];

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
  const [roomWiseData, setRoomWiseData] = useState<RoomWiseData>({});
  const [rooms, setRooms] = useState<Room[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    setRoomWiseData(getFromLocalStorage('timetable-roomwise-data', initialRoomData));
    setRooms(getFromLocalStorage('timetable-rooms', initialRooms));
    setTimeSlots(getFromLocalStorage('timetable-timeSlots', initialTimeSlots));
  }, []);

  // Load user profile (including demo profiles)
  useEffect(() => {
    if (user) {
      let profiles = getFromLocalStorage<Profile[]>('timetable-profiles', demoProfiles);
      
      // Check if this is a demo user
      let userProfile = demoProfiles.find(p => p.email === user.email);
      
      if (!userProfile) {
        // Check existing profiles
        userProfile = profiles.find(p => p.id === user.id);
        
        if (!userProfile) {
          userProfile = {
            id: user.id,
            email: user.email || '',
            role: 'user'
          };
          profiles.push(userProfile);
          saveToLocalStorage('timetable-profiles', profiles);
        }
      }
      
      setProfile(userProfile);
    } else {
      setProfile(null);
    }
  }, [user]);

  // Save data to localStorage when state changes
  useEffect(() => {
    saveToLocalStorage('timetable-roomwise-data', roomWiseData);
  }, [roomWiseData]);

  useEffect(() => {
    saveToLocalStorage('timetable-rooms', rooms);
  }, [rooms]);

  useEffect(() => {
    saveToLocalStorage('timetable-timeSlots', timeSlots);
  }, [timeSlots]);

  // Helper functions to extract data from room-wise structure
  const getAllSubjects = (): Subject[] => {
    const subjects: Subject[] = [];
    Object.values(roomWiseData).forEach(roomData => {
      subjects.push(...Object.values(roomData.subjects));
    });
    return subjects;
  };

  const getAllFaculty = (): Faculty[] => {
    const faculty: Faculty[] = [];
    Object.values(roomWiseData).forEach(roomData => {
      faculty.push(...Object.values(roomData.faculty));
    });
    return faculty;
  };

  const getAllScheduleEntries = (): ScheduleEntry[] => {
    const entries: ScheduleEntry[] = [];
    Object.values(roomWiseData).forEach(roomData => {
      entries.push(...Object.values(roomData.timetable));
    });
    return entries;
  };

  const getRoomData = (roomName: string): RoomData | null => {
    return roomWiseData[roomName] || null;
  };

  const updateRoomData = (roomName: string, data: Partial<RoomData>) => {
    setRoomWiseData(prev => ({
      ...prev,
      [roomName]: {
        ...prev[roomName],
        ...data
      }
    }));
  };

  // CRUD operations for schedule entries
  const addScheduleEntry = async (entry: Omit<ScheduleEntry, 'id'>) => {
    try {
      const newEntry = {
        ...entry,
        id: Date.now().toString()
      };
      
      const roomData = roomWiseData[entry.room] || {
        subjects: {},
        faculty: {},
        breaks: {},
        timing: { startTime: "09:00", endTime: "17:00" },
        timetable: {}
      };

      setRoomWiseData(prev => ({
        ...prev,
        [entry.room]: {
          ...roomData,
          timetable: {
            ...roomData.timetable,
            [newEntry.id]: newEntry
          }
        }
      }));

      return { data: newEntry, error: null };
    } catch (error) {
      console.error('Error adding schedule entry:', error);
      return { data: null, error };
    }
  };

  const updateScheduleEntry = async (id: string, updates: Partial<ScheduleEntry>) => {
    try {
      const updatedEntry = { ...updates, id } as ScheduleEntry;
      
      // Find which room contains this entry
      Object.keys(roomWiseData).forEach(roomName => {
        if (roomWiseData[roomName].timetable[id]) {
          setRoomWiseData(prev => ({
            ...prev,
            [roomName]: {
              ...prev[roomName],
              timetable: {
                ...prev[roomName].timetable,
                [id]: { ...prev[roomName].timetable[id], ...updates }
              }
            }
          }));
        }
      });

      return { data: updatedEntry, error: null };
    } catch (error) {
      console.error('Error updating schedule entry:', error);
      return { data: null, error };
    }
  };

  const deleteScheduleEntry = async (id: string) => {
    try {
      // Find and remove entry from the appropriate room
      Object.keys(roomWiseData).forEach(roomName => {
        if (roomWiseData[roomName].timetable[id]) {
          setRoomWiseData(prev => {
            const newTimetable = { ...prev[roomName].timetable };
            delete newTimetable[id];
            return {
              ...prev,
              [roomName]: {
                ...prev[roomName],
                timetable: newTimetable
              }
            };
          });
        }
      });

      return { error: null };
    } catch (error) {
      console.error('Error deleting schedule entry:', error);
      return { error };
    }
  };

  // Room management
  const addRoom = async (roomName: string) => {
    try {
      const newRoom = {
        id: Date.now().toString(),
        name: roomName,
        capacity: 30,
        type: 'Classroom'
      };

      setRooms(prev => [...prev, newRoom]);
      
      // Initialize room data structure
      setRoomWiseData(prev => ({
        ...prev,
        [roomName]: {
          subjects: {},
          faculty: {},
          breaks: {},
          timing: { startTime: "09:00", endTime: "17:00" },
          timetable: {}
        }
      }));

      return { data: newRoom, error: null };
    } catch (error) {
      console.error('Error adding room:', error);
      return { data: null, error };
    }
  };

  const updateRoom = async (oldName: string, newName: string) => {
    try {
      setRooms(prev => prev.map(room => 
        room.name === oldName ? { ...room, name: newName } : room
      ));

      // Update room data key
      setRoomWiseData(prev => {
        const newData = { ...prev };
        if (newData[oldName]) {
          newData[newName] = newData[oldName];
          delete newData[oldName];
        }
        return newData;
      });

      return { error: null };
    } catch (error) {
      console.error('Error updating room:', error);
      return { error };
    }
  };

  const deleteRoom = async (roomName: string) => {
    try {
      setRooms(prev => prev.filter(room => room.name !== roomName));
      
      // Remove room data
      setRoomWiseData(prev => {
        const newData = { ...prev };
        delete newData[roomName];
        return newData;
      });

      return { error: null };
    } catch (error) {
      console.error('Error deleting room:', error);
      return { error };
    }
  };

  // Time slot management
  const addTimeSlot = async (timeSlot: string) => {
    try {
      const newTimeSlot = {
        id: Date.now().toString(),
        time_slot: timeSlot,
        start_time: timeSlot.split(' - ')[0],
        end_time: timeSlot.split(' - ')[1]
      };

      setTimeSlots(prev => [...prev, newTimeSlot]);
      return { data: newTimeSlot, error: null };
    } catch (error) {
      console.error('Error adding time slot:', error);
      return { data: null, error };
    }
  };

  const updateTimeSlot = async (id: string, newTimeSlot: string) => {
    try {
      setTimeSlots(prev => prev.map(slot => 
        slot.id === id ? {
          ...slot,
          time_slot: newTimeSlot,
          start_time: newTimeSlot.split(' - ')[0],
          end_time: newTimeSlot.split(' - ')[1]
        } : slot
      ));
      return { error: null };
    } catch (error) {
      console.error('Error updating time slot:', error);
      return { error };
    }
  };

  const deleteTimeSlot = async (id: string) => {
    try {
      setTimeSlots(prev => prev.filter(slot => slot.id !== id));
      return { error: null };
    } catch (error) {
      console.error('Error deleting time slot:', error);
      return { error };
    }
  };

  const refetch = async () => {
    return Promise.resolve();
  };

  return {
    profile,
    subjects: getAllSubjects(),
    faculty: getAllFaculty(),
    rooms,
    timeSlots,
    scheduleEntries: getAllScheduleEntries(),
    roomWiseData,
    loading,
    getRoomData,
    updateRoomData,
    addScheduleEntry,
    updateScheduleEntry,
    deleteScheduleEntry,
    addRoom,
    updateRoom,
    deleteRoom,
    addTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
    refetch
  };
};
