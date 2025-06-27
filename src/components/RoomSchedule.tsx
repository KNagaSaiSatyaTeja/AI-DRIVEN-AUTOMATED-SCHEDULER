import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/context/AppContext";

export interface Faculty {
  _id: string;
  name: string;
}

export interface Room {
  _id: string;
  name: string;
}

export interface Subject {
  _id: string;
  name: string;
  time: number;
  noOfClassesPerWeek: number;
  room: Room;
  faculty: Faculty[];
  isSpecial: boolean;
  createdAt: string; // or Date, if parsed
  updatedAt: string; // or Date
  __v: number;
}

interface RoomScheduleProps {
  roomId: string;
  roomName: string;
  subjects: Subject[];
}

export function RoomSchedule({
  roomId,
  roomName,
  subjects,
}: RoomScheduleProps) {
  // Filter subjects that belong to this room
  const roomSubjects = subjects.filter(
    (subject) => subject.room?._id === roomId
  );

  // Get unique subject names
  const subjectNames = [...new Set(roomSubjects.map((s) => s.name))];

  // Get unique faculty names
  const facultyNames = [
    ...new Set(
      roomSubjects.flatMap((s) => s.faculty?.map((f: Faculty) => f.name) || [])
    ),
  ];
  const { role } = useApp();
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg">Room: {roomName}</CardTitle>
        {
          <Button asChild variant="outline" size="sm">
            <Link to={`/rooms/${roomId}`}>
              {role === "admin" ? "view & Manage" : "View room"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {subjectNames.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 text-sm text-muted-foreground">
                Subjects
              </h4>
              <div className="flex flex-wrap gap-2">
                {subjectNames.map((name, index) => (
                  <Badge key={`subject-${index}`} variant="secondary">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {facultyNames.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 text-sm text-muted-foreground">
                Faculty
              </h4>
              <div className="flex flex-wrap gap-2">
                {facultyNames.map((name, index) => (
                  <Badge key={`faculty-${index}`} variant="outline">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {subjectNames.length === 0 && facultyNames.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No schedule information available for this room.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
