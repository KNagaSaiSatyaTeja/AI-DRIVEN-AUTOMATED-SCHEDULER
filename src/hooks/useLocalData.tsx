
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

// Initial room data structure
const initialRoomData: RoomWiseData = {
  "A-101": {
    subjects: {
      "s1": { id: "s1", name: "Computer Science", code: "CS101", credits: 3 },
      "s2": { id: "s2", name: "Mathematics", code: "MATH101", credits: 4 }
    },
    faculty: {
      "f1": { id: "f1", name: "Dr. John Smith", email: "john.smith@university.edu", department: "Computer Science" },
      "f2": { id: "f2", name: "Prof. Jane Doe", email: "jane.doe@university.edu", department: "Mathematics" }
    },
    breaks: {
      "b1": { id: "b1", day: "ALL_DAYS", startTime: "13:00", endTime: "14:00" }
    },
    timing: {
      startTime: "09:00",
      endTime: "17:00"
    },
    timetable: {
      "monday-9": { id: "monday-9", day: "Monday", time: "9:00 AM - 10:00 AM", room: "A-101", subject: "Computer Science", faculty: "Dr. John Smith", class: "CS-1A" }
    }
  },
  "B-202": {
    subjects: {
      "s3": { id: "s3", name: "Physics", code: "PHY101", credits: 3 }
    },
    faculty: {
      "f3": { id: "f3", name: "Dr. Bob Wilson", email: "bob.wilson@university.edu", department: "Physics" }
    },
    breaks: {
      "b1": { id: "b1", day: "ALL_DAYS", startTime: "13:00", endTime: "14:00" }
    },
    timing: {
      startTime: "09:00",
      endTime: "17:00"
    },
    timetable: {}
  }
};

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
    refetch
  };
};
