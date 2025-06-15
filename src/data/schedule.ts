
export interface ScheduleEntry {
    time: string;
    subject: string;
    faculty: string;
    room: string;
    class: string;
    day: string;
}

export const scheduleData: ScheduleEntry[] = [
    { time: '09:00 - 10:30', subject: 'Quantum Physics', faculty: 'Dr. Evelyn Reed', room: 'A-101', class: 'MSc Physics', day: 'Monday' },
    { time: '10:30 - 12:00', subject: 'Data Structures', faculty: 'Prof. Samuel Tan', room: 'B-203', class: 'B.Tech CSE', day: 'Monday' },
    { time: '01:00 - 02:30', subject: 'Organic Chemistry', faculty: 'Dr. Aisha Khan', room: 'C-305', class: 'BSc Chemistry', day: 'Monday' },
    { time: '09:00 - 10:30', subject: 'Algorithms', faculty: 'Prof. Samuel Tan', room: 'B-203', class: 'B.Tech CSE', day: 'Tuesday' },
    { time: '10:30 - 12:00', subject: 'Biochemistry', faculty: 'Dr. Aisha Khan', room: 'C-305', class: 'BSc Chemistry', day: 'Tuesday' },
    { time: '01:00 - 02:30', subject: 'Thermodynamics', faculty: 'Dr. Evelyn Reed', room: 'A-101', class: 'MSc Physics', day: 'Tuesday' },
    { time: '09:00 - 10:30', subject: 'Classical Mechanics', faculty: 'Dr. Evelyn Reed', room: 'A-101', class: 'MSc Physics', day: 'Wednesday' },
    { time: '10:30 - 12:00', subject: 'Database Systems', faculty: 'Prof. Samuel Tan', room: 'B-203', class: 'B.Tech CSE', day: 'Wednesday' },
    { time: '02:30 - 04:00', subject: 'Physical Chemistry', faculty: 'Dr. Aisha Khan', room: 'C-305', class: 'BSc Chemistry', day: 'Wednesday' },
];

export const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const timeSlots = ['09:00 - 10:30', '10:30 - 12:00', '12:00 - 01:00', '01:00 - 02:30', '02:30 - 04:00'];

export const getUniqueRooms = () => {
    const rooms = new Set(scheduleData.map(entry => entry.room));
    return Array.from(rooms).sort();
}
