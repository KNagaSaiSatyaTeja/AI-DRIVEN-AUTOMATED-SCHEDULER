
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/context/AppContext';
import React, { useState } from 'react';

export function AddFacultyModal({ children, isOpen, onOpenChange }: { children: React.ReactNode, isOpen: boolean, onOpenChange: (isOpen: boolean) => void }) {
  const { setIsLoading } = useApp();
  const [name, setName] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log("Adding faculty:", name);
    // Simulate API call
    setTimeout(() => {
        setIsLoading(false);
        onOpenChange(false);
    }, 1500);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Faculty</DialogTitle>
            <DialogDescription>
              Enter the details for the new faculty member. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Full Name
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3 cursor-text" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input id="email" type="email" className="col-span-3 cursor-text" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subjects" className="text-right">
                Subjects
              </Label>
              <Input id="subjects" placeholder="e.g., Math, Science" className="col-span-3 cursor-text" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="cursor-pointer">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
