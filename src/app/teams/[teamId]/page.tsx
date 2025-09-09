"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  User, 
  Crown, 
  Shield, 
  ArrowLeft, 
  Plus, 
  Mail, 
  Calendar,
  Trash2,
  Edit,
  Loader2
} from "lucide-react";
import { TeamMemberRow } from "@/components/team-member-row";
import { AddMemberModal } from "@/components/modals/add-member-modal";
import { useSocket } from "@/hooks/useSocket";
import AdSensePlaceholder from "@/components/AdSensePlaceholder";
import { toast } from "sonner";

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

interface Team {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  members: TeamMember[];
  currentUserRole: string;
}

export default function TeamDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;
  
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [editTeamData, setEditTeamData] = useState({ name: "", description: "" });
  const [optimisticUpdates, setOptimisticUpdates] = useState<Set<string>>(new Set());

  const { 
    onTeamUpdated, 
    onMemberAdded, 
    onMemberRemoved, 
    onMemberRoleUpdated,
    isConnected,
    joinTeamDetail,
    leaveTeamDetail 
  } = useSocket({
    enableTeamUpdates: true,
    enableTeamDetail: true,
    teamId,
  });

  const fetchTeamDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/teams/${teamId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch team details");
      }
      
      const teamData = await response.json();
      setTeam(teamData);
      setEditTeamData({
        name: teamData.name,
        description: teamData.description || "",
      });
    } catch (err) {
      console.error("Error fetching team details:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      toast.error("Failed to load team details");
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  const handleAddMember = useCallback(async (memberData: { email: string; role: string }) => {
    const optimisticId = `optimistic-member-${Date.now()}`;
    const optimisticMember: TeamMember = {
      id: optimisticId,
      teamId,
      userId: "optimistic",
      role: memberData.role.toUpperCase(),
      createdAt: new Date().toISOString(),
      user: {
        id: "optimistic",
        name: memberData.email.split('@')[0],
        email: memberData.email,
      },
    };

    // Optimistic update
    setOptimisticUpdates(prev => new Set(prev).add(optimisticId));
    setTeam(prev => prev ? {
      ...prev,
      members: [...prev.members, optimisticMember],
    } : null);

    try {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(memberData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add member");
      }

      await fetchTeamDetails(); // Refresh team data to get real member
      setIsAddMemberModalOpen(false);
      toast.success("Member added successfully!");
    } catch (err) {
      console.error("Error adding member:", err);
      
      // Remove optimistic update on error
      setOptimisticUpdates(prev => {
        const newSet = new Set(prev);
        newSet.delete(optimisticId);
        return newSet;
      });
      
      setTeam(prev => prev ? {
        ...prev,
        members: prev.members.filter(member => member.id !== optimisticId),
      } : null);
      
      toast.error(err instanceof Error ? err.message : "Failed to add member");
    }
  }, [teamId, fetchTeamDetails]);

  const handleUpdateMemberRole = useCallback(async (memberId: string, newRole: string) => {
    const previousRole = team?.members.find(m => m.id === memberId)?.role;
    
    // Optimistic update
    setTeam(prev => prev ? {
      ...prev,
      members: prev.members.map(member =>
        member.id === memberId ? { ...member, role: newRole.toUpperCase() } : member
      ),
    } : null);

    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update member role");
      }

      // Real-time update will handle the refresh
      toast.success("Member role updated successfully!");
    } catch (err) {
      console.error("Error updating member role:", err);
      
      // Revert optimistic update on error
      setTeam(prev => prev ? {
        ...prev,
        members: prev.members.map(member =>
          member.id === memberId ? { ...member, role: previousRole || member.role } : member
        ),
      } : null);
      
      toast.error(err instanceof Error ? err.message : "Failed to update member role");
    }
  }, [teamId, team?.members]);

  const handleRemoveMember = useCallback(async (memberId: string) => {
    const memberToRemove = team?.members.find(m => m.id === memberId);
    
    // Optimistic update
    setTeam(prev => prev ? {
      ...prev,
      members: prev.members.filter(member => member.id !== memberId),
    } : null);

    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove member");
      }

      // Real-time update will handle the refresh
      toast.success("Member removed successfully!");
    } catch (err) {
      console.error("Error removing member:", err);
      
      // Revert optimistic update on error
      setTeam(prev => prev ? {
        ...prev,
        members: memberToRemove ? [...prev.members, memberToRemove] : prev.members,
      } : null);
      
      toast.error(err instanceof Error ? err.message : "Failed to remove member");
    }
  }, [teamId, team?.members]);

  const handleUpdateTeam = useCallback(async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editTeamData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update team");
      }

      await fetchTeamDetails(); // Refresh team data
      setIsEditingTeam(false);
      toast.success("Team updated successfully!");
    } catch (err) {
      console.error("Error updating team:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update team");
    }
  }, [teamId, editTeamData, fetchTeamDetails]);

  // Handle real-time updates
  useEffect(() => {
    const handleTeamUpdated = (data: { teamId: string; updates: any; timestamp: string }) => {
      if (data.teamId === teamId) {
        console.log("Real-time team updated:", data);
        setTeam(prev => prev ? {
          ...prev,
          ...data.updates,
          updatedAt: data.timestamp,
        } : null);
        
        toast.info("Team information updated");
      }
    };

    const handleMemberAdded = (data: { teamId: string; member: TeamMember; timestamp: string }) => {
      if (data.teamId === teamId) {
        console.log("Real-time member added:", data.member);
        setTeam(prev => prev ? {
          ...prev,
          members: [...prev.members.filter(m => m.id !== data.member.id), data.member],
        } : null);
        
        toast.success(`${data.member.user.name || data.member.user.email} joined the team`);
      }
    };

    const handleMemberRemoved = (data: { teamId: string; memberId: string; timestamp: string }) => {
      if (data.teamId === teamId) {
        console.log("Real-time member removed:", data.memberId);
        const removedMember = team?.members.find(m => m.id === data.memberId);
        setTeam(prev => prev ? {
          ...prev,
          members: prev.members.filter(member => member.id !== data.memberId),
        } : null);
        
        if (removedMember) {
          toast.info(`${removedMember.user.name || removedMember.user.email} left the team`);
        }
      }
    };

    const handleMemberRoleUpdated = (data: { teamId: string; memberId: string; newRole: string; timestamp: string }) => {
      if (data.teamId === teamId) {
        console.log("Real-time member role updated:", data);
        setTeam(prev => prev ? {
          ...prev,
          members: prev.members.map(member =>
            member.id === data.memberId ? { ...member, role: data.newRole } : member
          ),
        } : null);
        
        const updatedMember = team?.members.find(m => m.id === data.memberId);
        if (updatedMember) {
          toast.info(`${updatedMember.user.name || updatedMember.user.email} role changed to ${data.newRole}`);
        }
      }
    };

    onTeamUpdated(handleTeamUpdated);
    onMemberAdded(handleMemberAdded);
    onMemberRemoved(handleMemberRemoved);
    onMemberRoleUpdated(handleMemberRoleUpdated);

    return () => {
      // Cleanup event listeners
      if (isConnected) {
        // Note: In a real implementation, you'd want to store the callback references
        // to properly remove them. For now, we'll rely on the hook's cleanup.
      }
    };
  }, [onTeamUpdated, onMemberAdded, onMemberRemoved, onMemberRoleUpdated, teamId, team?.members, isConnected]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated" && teamId) {
      fetchTeamDetails();
    }
  }, [status, teamId, router, fetchTeamDetails]);

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

  const canManageMembers = team?.currentUserRole && ["OWNER", "ADMIN"].includes(team.currentUserRole);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team details...</p>
          {!isConnected && (
            <p className="text-sm text-gray-500 mt-2">Establishing real-time connection...</p>
          )}
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error || "Team not found"}</p>
          <Button onClick={() => router.push("/teams")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Teams
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => router.push("/teams")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Teams
          </Button>
          
          {isEditingTeam ? (
            <div className="flex items-center gap-3">
              <Input
                value={editTeamData.name}
                onChange={(e) => setEditTeamData(prev => ({ ...prev, name: e.target.value }))}
                className="text-2xl font-bold"
                maxLength={50}
              />
              <div className="flex gap-2">
                <Button onClick={handleUpdateTeam} size="sm">
                  Save
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditingTeam(false);
                    setEditTeamData({
                      name: team.name,
                      description: team.description || "",
                    });
                  }}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                {team.name}
                {isConnected && (
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                )}
              </h1>
              {canManageMembers && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditingTeam(true)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {canManageMembers && (
          <Button 
            onClick={() => setIsAddMemberModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Member
          </Button>
        )}
      </div>

      {/* Team Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditingTeam ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={editTeamData.description}
                    onChange={(e) => setEditTeamData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md resize-none"
                    rows={3}
                    maxLength={500}
                    placeholder="Enter team description"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {editTeamData.description.length}/500 characters
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">
                    {team.description || "No description provided"}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Owner</h3>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">
                        {team.owner.name || team.owner.email}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Created</h3>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">
                        {formatDate(team.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Your Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {getRoleIcon(team.currentUserRole)}
              <Badge variant={getRoleBadgeVariant(team.currentUserRole)}>
                {team.currentUserRole}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              {team.currentUserRole === "OWNER" && "You can manage all aspects of this team."}
              {team.currentUserRole === "ADMIN" && "You can manage team members and settings."}
              {team.currentUserRole === "MEMBER" && "You are a member of this team."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Members Section */}
      
      {/* AdSense Placeholder - Square size in sidebar */}
      <div className="mb-8 flex justify-center">
        <AdSensePlaceholder size="square" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Members ({team.members.length})
              {isConnected && (
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {team.members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No members in this team yet</p>
              {canManageMembers && (
                <Button onClick={() => setIsAddMemberModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Member
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {team.members.map((member) => (
                <TeamMemberRow
                  key={member.id}
                  member={member}
                  canManage={canManageMembers}
                  isCurrentUser={member.userId === session?.user?.id}
                  isOptimistic={optimisticUpdates.has(member.id)}
                  onUpdateRole={handleUpdateMemberRole}
                  onRemove={handleRemoveMember}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onSubmit={handleAddMember}
      />
    </div>
  );
}