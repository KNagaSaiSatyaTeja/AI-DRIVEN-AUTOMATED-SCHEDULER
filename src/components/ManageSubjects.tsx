
import { useState, useEffect } from "react";
import { TimetableConfig, SubjectConfig, FacultyConfig } from "@/data/schedule";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2 } from "lucide-react";
import { EditSubjectModal } from "./EditSubjectModal";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";

interface ManageSubjectsProps {
  config: TimetableConfig;
  setConfig: (config: TimetableConfig) => void;
  isAdmin: boolean;
}

export function ManageSubjects({
  config,
  setConfig,
  isAdmin,
}: ManageSubjectsProps) {
  const { selectedRoom, setIsLoading, token } = useApp();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectConfig | null>(
    null
  );
  const [subjects, setSubjects] = useState<SubjectConfig[]>([]);
  const [faculty, setFaculty] = useState<FacultyConfig[]>([]);

  const fetchSubjects = async () => {
    if (!selectedRoom || !token) return;
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/subject/room/${selectedRoom}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const transformedSubjects = response.data.map((s: any) => ({
        _id: s._id,
        name: s.name,
        duration: s.time,
        no_of_classes_per_week: s.noOfClassesPerWeek,
        facultyIds: s.faculty?.map((f: any) => f.facultyId || f._id) || [],
        isSpecial: s.isSpecial || false,
      }));

      setSubjects(transformedSubjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast({
        title: "Error",
        description: "Failed to fetch subjects data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFaculty = async () => {
    if (!selectedRoom || !token) return;
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/faculty/room/${selectedRoom}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const transformedFaculty = response.data.map((f: any) => ({
        _id: f.facultyId || f._id,
        name: f.name,
        availability: f.availability || [],
      }));

      setFaculty(transformedFaculty);
      // Update config.faculty to keep it in sync
      setConfig({
        ...config,
        faculty: transformedFaculty,
      });
    } catch (error) {
      console.error("Error fetching faculty:", error);
      toast({
        title: "Error",
        description: "Failed to fetch faculty data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRoom && token) {
      fetchSubjects();
      fetchFaculty();
    }
  }, [selectedRoom, token]);

  const handleAddSubject = () => {
    if (!selectedRoom) {
      toast({
        title: "No room selected",
        variant: "destructive",
      });
      return;
    }
    setEditingSubject(null);
    setIsModalOpen(true);
  };

  const handleEditSubject = (subject: SubjectConfig) => {
    if (!selectedRoom) {
      toast({
        title: "No room selected",
        variant: "destructive",
      });
      return;
    }
    setEditingSubject(subject);
    setIsModalOpen(true);
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!selectedRoom || !token) return;
    setIsLoading(true);
    try {
      await axios.delete(
        `${
          import.meta.env.VITE_APP_API_BASE_URL
        }/subject/room/${selectedRoom}/${subjectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchSubjects();
      toast({
        title: "Subject Deleted",
        description: "Subject has been removed successfully.",
      });
    } catch (error) {
      console.error("Error deleting subject:", error);
      toast({
        title: "Error",
        description: "Failed to delete subject.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manage Subjects</CardTitle>
            <CardDescription>
              Add, edit, or remove subjects for the college.
            </CardDescription>
          </div>
          {isAdmin && (
            <Button size="sm" onClick={handleAddSubject}>
              <Plus className="mr-2" /> Add Subject
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Duration (mins)</TableHead>
                <TableHead>No. of Periods/Week</TableHead>
                <TableHead>Assigned Faculty</TableHead>
                {isAdmin && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.length > 0 ? (
                subjects.map((subject) => (
                  <TableRow key={subject._id}>
                    <TableCell className="font-medium">
                      {subject.name}
                    </TableCell>
                    <TableCell>{subject.duration}</TableCell>
                    <TableCell>{subject.no_of_classes_per_week}</TableCell>
                    <TableCell>
                      {subject.facultyIds
                        .map((fid) => faculty.find((f) => f._id === fid)?.name)
                        .filter(Boolean)
                        .join(", ") || "None"}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditSubject(subject)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSubject(subject._id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 5 : 4}
                    className="text-center text-muted-foreground"
                  >
                    No subjects added yet.
                  </TableCell>
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
        allFaculty={faculty} // Use fetched faculty
        onSaveSuccess={fetchSubjects}
      />
    </>
  );
}
