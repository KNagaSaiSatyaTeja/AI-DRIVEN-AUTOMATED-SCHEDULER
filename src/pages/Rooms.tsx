import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalData } from '@/hooks/useLocalData';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useApp } from '@/context/AppContext';

export default function Rooms() {
  const { role } = useApp();
  const { rooms, addRoom, updateRoom, deleteRoom } = useLocalData();
  const isAdmin = role === 'admin';
  const { toast } = useToast();
  
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isAlertDialogOpen, setAlertDialogOpen] = useState(false);
  
  const [currentRoom, setCurrentRoom] = useState('');
  const [formValue, setFormValue] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formValue && !rooms.some(r => r.name === formValue)) {
      const result = await addRoom(formValue);
      if (result.data) {
        toast({ title: "Room added", description: `Room "${formValue}" has been added.` });
        setAddDialogOpen(false);
        setFormValue('');
      } else {
        toast({ title: "Error", description: "Failed to add room.", variant: "destructive" });
      }
    } else {
      toast({ title: "Error", description: "Room name cannot be empty or already exist.", variant: "destructive" });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formValue && (!rooms.some(r => r.name === formValue) || formValue === currentRoom)) {
      const result = await updateRoom(currentRoom, formValue);
      if (!result.error) {
        toast({ title: "Room updated", description: `Room "${currentRoom}" has been updated to "${formValue}".` });
        setEditDialogOpen(false);
        setFormValue('');
        setCurrentRoom('');
      } else {
        toast({ title: "Error", description: "Failed to update room.", variant: "destructive" });
      }
    } else {
      toast({ title: "Error", description: "Room name cannot be empty or already exist.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    const result = await deleteRoom(currentRoom);
    if (!result.error) {
      toast({ title: "Room deleted", description: `Room "${currentRoom}" has been deleted.` });
      setAlertDialogOpen(false);
      setCurrentRoom('');
    } else {
      toast({ title: "Error", description: "Failed to delete room.", variant: "destructive" });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Manage Rooms</h1>
          <p className="text-muted-foreground">
            {isAdmin ? 'Add, edit, or delete rooms.' : 'Browse available rooms.'} Changes are stored locally.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setFormValue(''); setAddDialogOpen(true); }}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Room
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rooms.map((room) => (
          <Card key={room.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <Link to={`/rooms/${room.name}`} className="hover:underline">
                  Room: {room.name}
                </Link>
              </CardTitle>
              {isAdmin && (
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => { setCurrentRoom(room.name); setFormValue(room.name); setEditDialogOpen(true); }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { setCurrentRoom(room.name); setAlertDialogOpen(true); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Add Room Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Room</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd}>
            <div className="grid gap-4 py-4">
              <Label htmlFor="room-name">Room Name</Label>
              <Input
                id="room-name"
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                placeholder="e.g. Room 101"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Add Room</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Room Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Room: {currentRoom}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 py-4">
              <Label htmlFor="edit-room-name">New Room Name</Label>
              <Input
                id="edit-room-name"
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Room Alert Dialog */}
      <AlertDialog open={isAlertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete room "{currentRoom}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
