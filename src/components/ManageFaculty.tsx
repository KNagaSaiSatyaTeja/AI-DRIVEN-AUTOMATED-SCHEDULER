import { useState } from 'react';
import { TimetableConfig, FacultyConfig } from '@/data/schedule';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { EditFacultyModal } from './EditFacultyModal';

interface ManageFacultyProps {
  config: TimetableConfig;
  setConfig: (config: TimetableConfig) => void;
}

export function ManageFaculty({ config, setConfig }: ManageFacultyProps) {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<FacultyConfig | null>(null);

  const handleAddFaculty = () => {
    setEditingFaculty(null);
    setIsModalOpen(true);
  };

  const handleEditFaculty = (faculty: FacultyConfig) => {
    setEditingFaculty(faculty);
    setIsModalOpen(true);
  };

  const handleDeleteFaculty = (facultyId: string) => {
    // Check if faculty is assigned to any subject
    const isAssigned = config.subjects.some(s => s.facultyIds.includes(facultyId));
    if (isAssigned) {
      toast({
        title: "Cannot Delete Faculty",
        description: "This faculty member is assigned to one or more subjects. Please unassign them first.",
        variant: "destructive",
      });
      return;
    }
    setConfig({
      ...config,
      faculty: config.faculty.filter(f => f.id !== facultyId),
    });
  };

  const handleSaveFaculty = (faculty: FacultyConfig) => {
    const newFaculty = [...config.faculty];
    if (editingFaculty) {
      // Update
      const index = newFaculty.findIndex(f => f.id === faculty.id);
      if (index > -1) {
        newFaculty[index] = faculty;
      }
    } else {
      // Add
      newFaculty.push({ ...faculty, id: `f${Date.now()}` });
    }
    setConfig({ ...config, faculty: newFaculty });
    setIsModalOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manage Faculty</CardTitle>
            <CardDescription>Add, edit, or remove faculty members.</CardDescription>
          </div>
          <Button size="sm" onClick={handleAddFaculty}><Plus className="mr-2" /> Add Faculty</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-[40%]">Availability</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.faculty.length > 0 ? config.faculty.map(faculty => (
                <TableRow key={faculty.id}>
                  <TableCell className="font-medium">{faculty.name}</TableCell>
                  <TableCell>
                    {faculty.availability && faculty.availability.length > 0
                      ? <div className="flex flex-col gap-1">
                          {faculty.availability.map((a, i) => (
                            <span key={i} className="text-xs font-mono bg-muted/50 px-2 py-0.5 rounded">{`${a.day}: ${a.startTime} - ${a.endTime}`}</span>
                          ))}
                        </div>
                      : <span className="text-muted-foreground italic">Not specified</span>
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEditFaculty(faculty)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteFaculty(faculty.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">No faculty added yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <EditFacultyModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        faculty={editingFaculty}
        onSave={handleSaveFaculty}
      />
    </>
  );
}
