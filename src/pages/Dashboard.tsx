
import { Timetable } from '@/components/Timetable';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { AddFacultyModal } from '@/components/AddFacultyModal';
import { AddUserModal } from '@/components/AddUserModal';
import { useState } from 'react';
import { RoomView } from '@/components/RoomView';

export default function Dashboard() {
  const { role } = useApp();
  const [isFacultyModalOpen, setIsFacultyModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const isAdmin = role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's the current schedule.
          </p>
        </div>
        {isAdmin && (
          <div className="flex space-x-2">
            <Button className="cursor-pointer">Edit Timetable</Button>
            <AddFacultyModal isOpen={isFacultyModalOpen} onOpenChange={setIsFacultyModalOpen}>
              <Button onClick={() => setIsFacultyModalOpen(true)} variant="secondary" className="cursor-pointer">Add Faculty</Button>
            </AddFacultyModal>
            <AddUserModal isOpen={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
              <Button onClick={() => setIsUserModalOpen(true)} variant="secondary" className="cursor-pointer">Add User</Button>
            </AddUserModal>
          </div>
        )}
      </div>
      <Timetable />
      <div className="pt-6">
        <RoomView />
      </div>
    </div>
  );
}
