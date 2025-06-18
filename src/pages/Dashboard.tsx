
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { AddUserModal } from '@/components/AddUserModal';
import { useState } from 'react';
import { useLocalData } from '@/hooks/useLocalData';
import { RoomSchedule } from '@/components/RoomSchedule';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { role } = useApp();
  const { rooms } = useLocalData();
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const isAdmin = role === 'admin';

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
        {rooms.map(room => (
          <RoomSchedule key={room.id} roomId={room.name} />
        ))}
      </div>
    </div>
  );
}
