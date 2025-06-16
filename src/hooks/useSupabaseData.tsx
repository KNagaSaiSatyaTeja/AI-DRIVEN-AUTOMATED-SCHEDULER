
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

export const useSupabaseData = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch user profile
  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (data && !error) {
      setProfile(data);
    }
  };

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [subjectsRes, facultyRes, roomsRes, timeSlotsRes, scheduleRes] = await Promise.all([
        supabase.from('subjects').select('*').order('name'),
        supabase.from('faculty').select('*').order('name'),
        supabase.from('rooms').select('*').order('id'),
        supabase.from('time_slots').select('*').order('time_slot'),
        supabase.from('schedule_entries').select('*')
      ]);

      if (subjectsRes.data) setSubjects(subjectsRes.data);
      if (facultyRes.data) setFaculty(facultyRes.data);
      if (roomsRes.data) setRooms(roomsRes.data);
      if (timeSlotsRes.data) setTimeSlots(timeSlotsRes.data);
      if (scheduleRes.data) setScheduleEntries(scheduleRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // CRUD operations
  const addScheduleEntry = async (entry: Omit<ScheduleEntry, 'id'>) => {
    const { data, error } = await supabase
      .from('schedule_entries')
      .insert([entry])
      .select()
      .single();

    if (data && !error) {
      setScheduleEntries(prev => [...prev, data]);
    }
    return { data, error };
  };

  const updateScheduleEntry = async (id: string, updates: Partial<ScheduleEntry>) => {
    const { data, error } = await supabase
      .from('schedule_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (data && !error) {
      setScheduleEntries(prev => prev.map(entry => entry.id === id ? data : entry));
    }
    return { data, error };
  };

  const deleteScheduleEntry = async (id: string) => {
    const { error } = await supabase
      .from('schedule_entries')
      .delete()
      .eq('id', id);

    if (!error) {
      setScheduleEntries(prev => prev.filter(entry => entry.id !== id));
    }
    return { error };
  };

  const addTimeSlot = async (timeSlot: string) => {
    const { data, error } = await supabase
      .from('time_slots')
      .insert([{ time_slot: timeSlot }])
      .select()
      .single();

    if (data && !error) {
      setTimeSlots(prev => [...prev, data]);
    }
    return { data, error };
  };

  const updateTimeSlot = async (id: string, timeSlot: string) => {
    const { data, error } = await supabase
      .from('time_slots')
      .update({ time_slot: timeSlot })
      .eq('id', id)
      .select()
      .single();

    if (data && !error) {
      setTimeSlots(prev => prev.map(slot => slot.id === id ? data : slot));
    }
    return { data, error };
  };

  const deleteTimeSlot = async (id: string) => {
    const { error } = await supabase
      .from('time_slots')
      .delete()
      .eq('id', id);

    if (!error) {
      setTimeSlots(prev => prev.filter(slot => slot.id !== id));
    }
    return { error };
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchAllData();
    }
  }, [user]);

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
    refetch: fetchAllData
  };
};
