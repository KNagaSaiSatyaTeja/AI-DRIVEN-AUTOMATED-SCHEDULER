
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// NOTE: Data is duplicated from Timetable.tsx. Ideally, this should be in a shared file.
const scheduleData = [
    { time: '09:00 - 10:30', subject: 'Quantum Physics', faculty: 'Dr. Evelyn Reed', room: 'A-101', class: 'MSc Physics', day: 'Monday' },
    { time: '10:30 - 12:00', subject: 'Data Structures', faculty: 'Prof. Samuel Tan', room: 'B-203', class: 'B.Tech CSE', day: 'Monday' },
    { time: '01:00 - 02:30', subject: 'Organic Chemistry', faculty: 'Dr. Aisha Khan', room: 'C-305', class: 'BSc Chemistry', day: 'Monday' },
    { time: '09:00 - 10:30', subject: 'Algorithms', faculty: 'Prof. Samuel Tan', room: 'B-203', class: 'B.Tech CSE', day: 'Tuesday' },
    { time: '10:30 - 12:00', subject: 'Biochemistry', faculty: 'Dr. Aisha Khan', room: 'C-305', class: 'BSc Chemistry', day: 'Tuesday' },
    { time: '01:00 - 02:30', subject: 'Thermodynamics', faculty: 'Dr. Evelyn Reed', room: 'A-101', class: 'MSc Physics', day: 'Tuesday' },
];
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

interface ScheduleEntry {
    time: string;
    subject: string;
    faculty: string;
    room: string;
    class: string;
    day: string;
}

export function RoomView() {
    const rooms = scheduleData.reduce((acc, entry) => {
        const { room } = entry;
        if (!acc[room]) {
            acc[room] = [];
        }
        acc[room].push(entry);
        return acc;
    }, {} as Record<string, ScheduleEntry[]>);

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">Room Schedules</h2>
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                {Object.keys(rooms).sort().map((room) => (
                    <Card key={room}>
                        <CardHeader>
                            <CardTitle>Room: {room}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Day</TableHead>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Faculty</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rooms[room]
                                    .sort((a, b) => {
                                        const dayIndexA = days.indexOf(a.day);
                                        const dayIndexB = days.indexOf(b.day);
                                        if (dayIndexA !== dayIndexB) {
                                            return dayIndexA - dayIndexB;
                                        }
                                        return a.time.localeCompare(b.time);
                                    })
                                    .map((entry, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{entry.day}</TableCell>
                                            <TableCell>{entry.time}</TableCell>
                                            <TableCell className="font-semibold">{entry.subject}</TableCell>
                                            <TableCell>{entry.faculty}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
