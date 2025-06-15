
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FacultyConfig } from '@/data/schedule';

const facultySchema = z.object({
  name: z.string().min(1, 'Faculty name is required.'),
});

type FacultyFormValues = z.infer<typeof facultySchema>;

interface EditFacultyModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  faculty: FacultyConfig | null;
  onSave: (faculty: FacultyConfig) => void;
}

export function EditFacultyModal({ isOpen, onOpenChange, faculty, onSave }: EditFacultyModalProps) {
  const form = useForm<FacultyFormValues>({
    resolver: zodResolver(facultySchema),
    defaultValues: { name: '' }
  });

  useEffect(() => {
    if (faculty) {
      form.reset(faculty);
    } else {
      form.reset({ name: '' });
    }
  }, [faculty, isOpen, form]);

  const onSubmit = (data: FacultyFormValues) => {
    onSave({
      id: faculty?.id || '', // id set by parent
      name: data.name,
      availability: faculty?.availability || [], // Preserve existing availability
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{faculty ? 'Edit Faculty' : 'Add New Faculty'}</DialogTitle>
          <DialogDescription>Fill in the details for the faculty member.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Faculty Name</FormLabel>
                <FormControl><Input placeholder="e.g., Dr. Evelyn Reed" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-md">
              Note: Managing faculty availability is a work in progress and will be implemented soon.
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Save Faculty</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
