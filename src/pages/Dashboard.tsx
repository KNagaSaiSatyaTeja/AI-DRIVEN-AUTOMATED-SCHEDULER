import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { AddUserModal } from "@/components/AddUserModal";
import { useState, useEffect } from "react";
import { getUniqueRooms } from "@/data/schedule";
import { RoomSchedule } from "@/components/RoomSchedule";
import { Link } from "react-router-dom";
import axios from "axios";

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

export default function Dashboard() {
  const { role, token, setIsLoading } = useApp();
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const isAdmin = role === "admin";

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!token) return;
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_APP_API_BASE_URL}/subject`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setSubjects(response.data);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjects();
  }, [token, setIsLoading]);

  const rooms = getUniqueRooms(subjects); // expects subjects as input

  return (
    <div className="space-y-6">
      {/* Header section */}
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
            <AddUserModal
              isOpen={isUserModalOpen}
              onOpenChange={setIsUserModalOpen}
            >
              <Button
                onClick={() => setIsUserModalOpen(true)}
                variant="secondary"
                className="cursor-pointer"
              >
                Add User
              </Button>
            </AddUserModal>
          </div>
        )}
      </div>

      {/* Room schedules */}
      <div className="space-y-6">
        {rooms.map((room) => {
          const roomSubjects = subjects.filter((s) => s.room?.name === room);
          const roomId = roomSubjects[0]?.room?._id;

          return (
            <div key={room} className="space-y-2">
              {/* Per-room manage button */}

              {/* Existing UI card component */}
              <RoomSchedule
                roomId={roomId}
                roomName={room}
                subjects={roomSubjects}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
