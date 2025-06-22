
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { AddUserModal } from '@/components/AddUserModal';
import { useState, useEffect } from 'react';
import { getUniqueRooms } from '@/data/schedule';
import { RoomSchedule } from '@/components/RoomSchedule';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { role, getTimetables } = useApp();
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [timetables, setTimetables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = role === 'admin';

  useEffect(() => {
    const fetchTimetables = async () => {
      try {
        const data = await getTimetables();
        setTimetables(data);
      } catch (error) {
        console.error('Error fetching timetables:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimetables();
  }, [getTimetables]);

  const rooms = getUniqueRooms(timetables);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading timetables...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's the current schedule overview by room.
          </p>
        </div>
        {isAdmin && (
          <div className="flex space-x-2">
            <Button asChild className="cursor-pointer">
                <Link to="/rooms">Manage Rooms</Link>
            </Button>
            <AddUserModal isOpen={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
              <Button onClick={() => setIsUserModalOpen(true)} variant="secondary" className="cursor-pointer">Add User</Button>
            </AddUserModal>
          </div>
        )}
      </div>
      
      <div className="space-y-6">
        {rooms.length > 0 ? (
          rooms.map(room => (
            <RoomSchedule key={room} roomId={room} />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No rooms found. Create a timetable to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
