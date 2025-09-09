"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  User, 
  Crown, 
  Shield, 
  Mail, 
  Calendar, 
  Trash2, 
  MoreVertical,
  Edit,
  Loader2
} from "lucide-react";

interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface TeamMemberRowProps {
  member: TeamMember;
  canManage: boolean;
  isCurrentUser: boolean;
  isOptimistic?: boolean;
  onUpdateRole: (memberId: string, newRole: string) => void;
  onRemove: (memberId: string) => void;
}

export function TeamMemberRow({ 
  member, 
  canManage, 
  isCurrentUser, 
  isOptimistic = false,
  onUpdateRole, 
  onRemove 
}: TeamMemberRowProps) {
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState(member.role);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "OWNER":
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case "ADMIN":
        return <Shield className="w-4 h-4 text-blue-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "OWNER":
        return "default";
      case "ADMIN":
        return "secondary";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleRoleUpdate = async () => {
    if (selectedRole === member.role) {
      setIsEditingRole(false);
      return;
    }

    try {
      setIsUpdating(true);
      await onUpdateRole(member.id, selectedRole);
      setIsEditingRole(false);
    } catch (error) {
      console.error("Failed to update role:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    try {
      setIsUpdating(true);
      await onRemove(member.id);
      setIsRemoveDialogOpen(false);
    } catch (error) {
      console.error("Failed to remove member:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const canEditRole = canManage && !isCurrentUser && member.role !== "OWNER" && !isOptimistic;
  const canRemove = canManage && !isCurrentUser && 
    (member.role !== "OWNER" || member.role === "OWNER") && !isOptimistic;

  return (
    <Card className={`hover:bg-gray-50 transition-colors ${isOptimistic ? 'opacity-70 animate-pulse' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Member Info */}
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-3">
              {getRoleIcon(member.role)}
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  {member.user.name || member.user.email}
                  {isOptimistic && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
                  {isCurrentUser && (
                    <Badge variant="outline" className="text-xs">
                      You
                    </Badge>
                  )}
                </h3>
                <p className="text-sm text-gray-600">{member.user.email}</p>
              </div>
            </div>
          </div>

          {/* Role and Actions */}
          <div className="flex items-center gap-3">
            {/* Role Display/Edit */}
            {isEditingRole ? (
              <div className="flex items-center gap-2">
                <Select 
                  value={selectedRole} 
                  onValueChange={setSelectedRole}
                  disabled={isUpdating || isOptimistic}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="OWNER">Owner</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    onClick={handleRoleUpdate}
                    disabled={isUpdating || isOptimistic || selectedRole === member.role}
                  >
                    {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setIsEditingRole(false);
                      setSelectedRole(member.role);
                    }}
                    disabled={isUpdating || isOptimistic}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant={getRoleBadgeVariant(member.role)}>
                  {member.role}
                </Badge>
                {canEditRole && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setIsEditingRole(true)}
                    disabled={isOptimistic}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}

            {/* Remove Button */}
            {canRemove && (
              <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={isOptimistic}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Remove Team Member</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Alert>
                      <AlertDescription>
                        Are you sure you want to remove{" "}
                        <span className="font-semibold">
                          {member.user.name || member.user.email}
                        </span>{" "}
                        from the team? This action cannot be undone.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="flex justify-end gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsRemoveDialogOpen(false)}
                        disabled={isUpdating}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleRemove}
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Removing...
                          </>
                        ) : (
                          "Remove Member"
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Joined Date */}
            <div className="text-sm text-gray-500 hidden sm:block">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(member.createdAt)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}