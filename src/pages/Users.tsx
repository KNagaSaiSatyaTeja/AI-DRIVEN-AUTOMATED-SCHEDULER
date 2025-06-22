
import { useApp } from "@/context/AppContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AddUserModal } from "@/components/AddUserModal";
import { EditUserModal } from "@/components/EditUserModal";
import { useState, useEffect } from "react";
import axios from "axios";

export default function Users() {
  const { role, token } = useApp();
  const isAdmin = role === "admin";
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) return;
      
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000/api'}/users`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [token]);

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const refreshUsers = async () => {
    if (!token) return;
    
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000/api'}/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setUsers(response.data);
    } catch (error) {
      console.error("Error refreshing users:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground">
            Browse and manage system users.
          </p>
        </div>
        {isAdmin && (
          <AddUserModal
            isOpen={isAddModalOpen}
            onOpenChange={setIsAddModalOpen}
            onUserAdded={refreshUsers}
          >
            <Button className="cursor-pointer">Add New User</Button>
          </AddUserModal>
        )}
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card
            key={user._id}
            className={cn(!isAdmin && "cursor-not-allowed")}
          >
            <CardHeader className="flex flex-row items-center space-x-4">
              <Avatar>
                <AvatarImage
                  src={
                    user.avatar || `https://i.pravatar.cc/150?u=${user.email}`
                  }
                />
                <AvatarFallback>
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{user.name}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Role</h4>
                <Badge
                  variant={user.role === "admin" ? "default" : "secondary"}
                >
                  {user.role}
                </Badge>
              </div>
              {isAdmin && (
                <div className="flex justify-end pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => handleEditUser(user)}
                  >
                    Edit User
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedUser && (
        <EditUserModal
          user={selectedUser}
          isOpen={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onUserUpdated={refreshUsers}
        />
      )}
    </div>
  );
}
