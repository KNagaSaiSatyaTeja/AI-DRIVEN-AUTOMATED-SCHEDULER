
export interface ScheduleEntry {
    time: string;
    subject: string;
    faculty: string;
    room: string;
    class: string;
    day: string;
}

export const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const initialTimeSlots = ['09:00 - 10:30', '10:30 - 12:00', '12:00 - 01:00', '01:00 - 02:30', '02:30 - 04:00'];

// Utility function to get rooms from timetables
export const getUniqueRooms = (timetables: any[] = []) => {
    const rooms = new Set<string>();
    timetables.forEach(timetable => {
        if (timetable.rooms) {
            timetable.rooms.forEach((room: string) => rooms.add(room));
        }
    });
    return Array.from(rooms).sort();
};

// --- Timetable Configuration Types ---

export const configDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;

export type ConfigDay = (typeof configDays)[number];

export interface CollegeTime {
  startTime: string;
  endTime: string;
}

export interface BreakConfig {
  id: string;
  day: ConfigDay | 'ALL_DAYS';
  startTime: string;
  endTime: string;
}

export interface FacultyAvailability {
  day: ConfigDay;
  startTime: string;
  endTime: string;
}

export interface FacultyConfig {
  id: string;
  name: string;
  availability: FacultyAvailability[];
}

export interface SubjectConfig {
  id: string;
  name: string;
  duration: number; // in minutes
  no_of_classes_per_week: number;
  facultyIds: string[];
}

export interface TimetableConfig {
  collegeTime: CollegeTime;
  breaks: BreakConfig[];
  rooms: string[];
  subjects: SubjectConfig[];
  faculty: FacultyConfig[];
}
