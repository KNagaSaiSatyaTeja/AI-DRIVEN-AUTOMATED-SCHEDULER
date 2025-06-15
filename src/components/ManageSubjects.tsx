
import { useState } from 'react';
import { TimetableConfig, SubjectConfig } from '@/data/schedule';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { EditSubjectModal } from './EditSubjectModal';

interface ManageSubjectsProps {
  config: TimetableConfig;
  setConfig: (config: TimetableConfig) => void;
  isAdmin: boolean;
}

export function ManageSubjects({ config, setConfig, isAdmin }: ManageSubjectsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectConfig | null>(null);

  const handleAddSubject = () => {
    setEditingSubject(null);
    setIsModalOpen(true);
  };

  const handleEditSubject = (subject: SubjectConfig) => {
    setEditingSubject(subject);
    setIsModalOpen(true);
  };

  const handleDeleteSubject = (subjectId: string) => {
    setConfig({
      ...config,
      subjects: config.subjects.filter(s => s.id !== subjectId),
    });
  };

  const handleSaveSubject = (subject: SubjectConfig) => {
    const newSubjects = [...config.subjects];
    if (editingSubject) {
      // Update existing
      const index = newSubjects.findIndex(s => s.id === subject.id);
      if (index > -1) {
        newSubjects[index] = subject;
      }
    } else {
      // Add new
      newSubjects.push({ ...subject, id: `s${Date.now()}` });
    }
    setConfig({ ...config, subjects: newSubjects });
    setIsModalOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manage Subjects</CardTitle>
            <CardDescription>Add, edit, or remove subjects for the college.</CardDescription>
          </div>
          {isAdmin && <Button size="sm" onClick={handleAddSubject}><Plus className="mr-2" /> Add Subject</Button>}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Duration (mins)</TableHead>
                <TableHead>Classes/Week</TableHead>
                <TableHead>Assigned Faculty</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.subjects.length > 0 ? config.subjects.map(subject => (
                <TableRow key={subject.id}>
                  <TableCell className="font-medium">{subject.name}</TableCell>
                  <TableCell>{subject.duration}</TableCell>
                  <TableCell>{subject.no_of_classes_per_week}</TableCell>
                  <TableCell>
                    {subject.facultyIds.map(fid => config.faculty.find(f => f.id === fid)?.name).filter(Boolean).join(', ') || 'None'}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEditSubject(subject)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteSubject(subject.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={isAdmin ? 5 : 4} className="text-center text-muted-foreground">No subjects added yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <EditSubjectModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        subject={editingSubject}
        allFaculty={config.faculty}
        onSave={handleSaveSubject}
      />
    </>
  );
}
