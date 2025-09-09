"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Mail, 
  Calendar,
  Shield,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Settings
} from "lucide-react";
import { UsersSkeleton } from "@/components/admin/loading-skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { User, UserRole } from "@/types/admin";
import UserRoleModal from "@/components/admin/user-role-modal";
import UserStatusModal from "@/components/admin/user-status-modal";
import UserDeleteModal from "@/components/admin/user-delete-modal";
import { useSession } from "next-auth/react";

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState(true);
  const { data: session } = useSession();

  // Fetch users from API
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/cities");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      
      // For demo purposes, we'll use mock data with proper User type
      // In a real app, you would fetch from a dedicated users API
      const mockUsers: User[] = [
        {
          id: "1",
          name: "Admin User",
          email: "admin@timezone.com",
          role: "admin" as UserRole,
          isActive: true,
          createdAt: new Date("2024-01-15"),
          updatedAt: new Date("2024-01-20"),
          emailVerified: new Date("2024-01-15"),
          image: "https://avatar.vercel.sh/admin"
        },
        {
          id: "2", 
          name: "Manager User",
          email: "manager@timezone.com",
          role: "manager" as UserRole,
          isActive: true,
          createdAt: new Date("2024-01-16"),
          updatedAt: new Date("2024-01-19"),
          emailVerified: new Date("2024-01-16"),
          image: "https://avatar.vercel.sh/manager"
        },
        {
          id: "3",
          name: "Regular User", 
          email: "user@timezone.com",
          role: "user" as UserRole,
          isActive: true,
          createdAt: new Date("2024-01-18"),
          updatedAt: new Date("2024-01-20"),
          emailVerified: new Date("2024-01-18"),
          image: "https://avatar.vercel.sh/user"
        }
      ];
      
      setUsers(mockUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      // Fallback to mock data
      const mockUsers: User[] = [
        {
          id: "1",
          name: "Admin User",
          email: "admin@timezone.com",
          role: "admin" as UserRole,
          isActive: true,
          createdAt: new Date("2024-01-15"),
          updatedAt: new Date("2024-01-20"),
          emailVerified: new Date("2024-01-15"),
          image: null
        },
        {
          id: "2", 
          name: "Manager User",
          email: "manager@timezone.com",
          role: "manager" as UserRole,
          isActive: true,
          createdAt: new Date("2024-01-16"),
          updatedAt: new Date("2024-01-19"),
          emailVerified: new Date("2024-01-16"),
          image: null
        },
        {
          id: "3",
          name: "Regular User", 
          email: "user@timezone.com",
          role: "user" as UserRole,
          isActive: true,
          createdAt: new Date("2024-01-18"),
          updatedAt: new Date("2024-01-20"),
          emailVerified: new Date("2024-01-18"),
          image: null
        }
      ];
      setUsers(mockUsers);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (user: User) => {
    setSelectedUser(user);
    setIsRoleModalOpen(true);
  };

  const handleStatusChange = (user: User, isActive: boolean) => {
    setSelectedUser(user);
    setNewStatus(isActive);
    setIsStatusModalOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleActionSuccess = () => {
    fetchUsers(); // Refresh the user list
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "manager":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <Badge className="bg-green-100 text-green-800">Active</Badge>
      : <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
  };

  const canModifyUser = (user: User) => {
    // Prevent admin from modifying themselves
    return user.email !== session?.user?.email;
  };

  if (isLoading) {
    return <UsersSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">
            Manage user accounts and permissions
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-xs text-gray-600">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.role === "admin").length}
                </p>
                <p className="text-xs text-gray-600">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.role === "manager").length}
                </p>
                <p className="text-xs text-gray-600">Managers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-gray-600" />
              <div>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.role === "user").length}
                </p>
                <p className="text-xs text-gray-600">Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Users</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {user.name?.charAt(0) || user.email.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{user.name || "Unknown User"}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(user.isActive)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Calendar className="h-3 w-3" />
                      <span>{user.createdAt.toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={!canModifyUser(user)}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleRoleChange(user)}>
                          <Settings className="mr-2 h-4 w-4" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.isActive ? (
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(user, false)}
                            className="text-orange-600"
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(user, true)}
                            className="text-green-600"
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          Email User
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(user)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modals */}
      <UserRoleModal
        user={selectedUser}
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onSuccess={handleActionSuccess}
      />

      <UserStatusModal
        user={selectedUser}
        newStatus={newStatus}
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onSuccess={handleActionSuccess}
      />

      <UserDeleteModal
        user={selectedUser}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
}