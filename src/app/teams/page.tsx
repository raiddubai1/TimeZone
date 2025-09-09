"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, User, Crown, Shield } from "lucide-react";
import { TeamCard } from "@/components/team-card";
import { CreateTeamModal } from "@/components/modals/create-team-modal";
import { useSocket } from "@/hooks/useSocket";
import AdSensePlaceholder from "@/components/AdSensePlaceholder";
import { toast } from "sonner";

interface Team {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  memberCount: number;
  membership: {
    role: string;
    joinedAt: string;
  };
}

export default function TeamsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [optimisticUpdates, setOptimisticUpdates] = useState<Set<string>>(new Set());

  const { 
    isConnected, 
    joinTeamList, 
    leaveTeamList,
    onTeamCreated, 
    onTeamUpdated, 
    onTeamDeleted,
    offTeamCreated,
    offTeamUpdated,
    offTeamDeleted
  } = useSocket();

  const fetchTeams = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch("/api/teams");
      if (!response.ok) {
        throw new Error("Failed to fetch teams");
      }
      
      const teamsData = await response.json();
      setTeams(teamsData);
    } catch (err) {
      console.error("Error fetching teams:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      toast.error("Failed to load teams");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCreateTeam = useCallback(async (teamData: { name: string; description?: string }) => {
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticTeam: Team = {
      id: optimisticId,
      name: teamData.name,
      description: teamData.description || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      owner: {
        id: session?.user?.id || "",
        name: session?.user?.name || null,
        email: session?.user?.email || "",
      },
      memberCount: 1,
      membership: {
        role: "OWNER",
        joinedAt: new Date().toISOString(),
      },
    };

    // Optimistic update
    setOptimisticUpdates(prev => new Set(prev).add(optimisticId));
    setTeams(prev => [optimisticTeam, ...prev]);
    toast.success("Creating team...");

    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(teamData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create team");
      }

      const newTeam = await response.json();
      
      // Remove optimistic update and add real team
      setOptimisticUpdates(prev => {
        const newSet = new Set(prev);
        newSet.delete(optimisticId);
        return newSet;
      });
      
      // Replace optimistic team with real team
      setTeams(prev => 
        prev.map(team => 
          team.id === optimisticId ? newTeam : team
        )
      );
      
      setIsCreateModalOpen(false);
      // Toast will be shown by real-time event handler (but we already showed creating toast)
    } catch (err) {
      console.error("Error creating team:", err);
      
      // Remove optimistic update on error
      setOptimisticUpdates(prev => {
        const newSet = new Set(prev);
        newSet.delete(optimisticId);
        return newSet;
      });
      
      // Remove optimistic team from list
      setTeams(prev => prev.filter(team => team.id !== optimisticId));
      toast.error(err instanceof Error ? err.message : "Failed to create team");
    }
  }, [session?.user?.id, session?.user?.name, session?.user?.email]);

  const handleUpdateTeam = useCallback(async (teamId: string, updates: { name?: string; description?: string }) => {
    const optimisticUpdateId = `update-${teamId}`;
    
    // Store original team data for rollback
    const originalTeam = teams.find(team => team.id === teamId);
    if (!originalTeam) return;

    // Mark as optimistic update
    setOptimisticUpdates(prev => new Set(prev).add(optimisticUpdateId));
    
    // Apply optimistic update
    setTeams(prev => 
      prev.map(team => 
        team.id === teamId 
          ? { ...team, ...updates, updatedAt: new Date().toISOString() }
          : team
      )
    );

    toast.info("Updating team...");

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update team");
      }

      const updatedTeam = await response.json();
      
      // Remove optimistic update marker
      setOptimisticUpdates(prev => {
        const newSet = new Set(prev);
        newSet.delete(optimisticUpdateId);
        return newSet;
      });
      
      // Update with real data (will also be handled by real-time event)
      setTeams(prev => 
        prev.map(team => 
          team.id === teamId ? updatedTeam : team
        )
      );
      
      toast.success("Team updated successfully");
    } catch (err) {
      console.error("Error updating team:", err);
      
      // Remove optimistic update marker
      setOptimisticUpdates(prev => {
        const newSet = new Set(prev);
        newSet.delete(optimisticUpdateId);
        return newSet;
      });
      
      // Revert to original team data
      setTeams(prev => 
        prev.map(team => 
          team.id === teamId ? originalTeam : team
        )
      );
      
      toast.error(err instanceof Error ? err.message : "Failed to update team");
    }
  }, [teams]);

  const handleDeleteTeam = useCallback(async (teamId: string) => {
    const teamToDelete = teams.find(team => team.id === teamId);
    if (!teamToDelete) return;

    const optimisticDeleteId = `delete-${teamId}`;
    
    // Mark as optimistic update
    setOptimisticUpdates(prev => new Set(prev).add(optimisticDeleteId));
    
    // Apply optimistic deletion
    setTeams(prev => prev.filter(team => team.id !== teamId));
    toast.info("Deleting team...");

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete team");
      }

      // Remove optimistic update marker
      setOptimisticUpdates(prev => {
        const newSet = new Set(prev);
        newSet.delete(optimisticDeleteId);
        return newSet;
      });
      
      toast.success(`Team "${teamToDelete.name}" deleted successfully`);
      
      // Redirect if we were on the team detail page
      if (typeof window !== 'undefined' && window.location.pathname.startsWith(`/teams/${teamId}`)) {
        router.push("/teams");
      }
    } catch (err) {
      console.error("Error deleting team:", err);
      
      // Remove optimistic update marker
      setOptimisticUpdates(prev => {
        const newSet = new Set(prev);
        newSet.delete(optimisticDeleteId);
        return newSet;
      });
      
      // Restore the team
      setTeams(prev => [teamToDelete, ...prev]);
      
      toast.error(err instanceof Error ? err.message : "Failed to delete team");
    }
  }, [teams, router]);

  // Handle real-time team events
  useEffect(() => {
    if (!session?.user?.id) return;

    // Join team list room for real-time updates
    joinTeamList(session.user.id);

    const handleTeamCreated = (data: { team: Team; timestamp: string }) => {
      console.log("Real-time team created:", data.team);
      
      // Check if this team is already in our list (avoid duplicates)
      setTeams(prev => {
        const existingTeam = prev.find(team => team.id === data.team.id);
        if (existingTeam) {
          // Update existing team if it exists (might be optimistic)
          return prev.map(team => 
            team.id === data.team.id ? data.team : team
          );
        }
        return [data.team, ...prev];
      });
      
      // Don't show toast for optimistic updates that were created by this user
      if (!optimisticUpdates.has(data.team.id)) {
        toast.success(`New team "${data.team.name}" created`);
      }
    };

    const handleTeamUpdated = (data: { teamId: string; updates: any; timestamp: string }) => {
      console.log("Real-time team updated:", data);
      
      setTeams(prev => 
        prev.map(team => 
          team.id === data.teamId 
            ? { ...team, ...data.updates, updatedAt: data.timestamp }
            : team
        )
      );
      
      const updatedTeam = teams.find(team => team.id === data.teamId);
      if (updatedTeam) {
        // Only show toast if this update wasn't triggered by the current user's optimistic update
        const isOptimistic = optimisticUpdates.has(`update-${data.teamId}`);
        if (!isOptimistic) {
          toast.info(`Team "${updatedTeam.name}" updated`);
        }
      }
    };

    const handleTeamDeleted = (data: { teamId: string; timestamp: string }) => {
      console.log("Real-time team deleted:", data);
      
      const deletedTeam = teams.find(team => team.id === data.teamId);
      setTeams(prev => prev.filter(team => team.id !== data.teamId));
      
      if (deletedTeam) {
        // Only show toast if this deletion wasn't triggered by the current user's optimistic update
        const isOptimistic = optimisticUpdates.has(`delete-${data.teamId}`);
        if (!isOptimistic) {
          toast.info(`Team "${deletedTeam.name}" deleted`);
        }
        
        // If we're currently viewing the deleted team, redirect to teams list
        if (typeof window !== 'undefined' && window.location.pathname.startsWith(`/teams/${data.teamId}`)) {
          router.push("/teams");
        }
      }
    };

    // Register event listeners
    onTeamCreated(handleTeamCreated);
    onTeamUpdated(handleTeamUpdated);
    onTeamDeleted(handleTeamDeleted);

    return () => {
      // Cleanup: leave team list room and remove event listeners
      if (session?.user?.id) {
        leaveTeamList(session.user.id);
      }
      offTeamCreated(handleTeamCreated);
      offTeamUpdated(handleTeamUpdated);
      offTeamDeleted(handleTeamDeleted);
    };
  }, [session?.user?.id, joinTeamList, leaveTeamList, onTeamCreated, onTeamUpdated, onTeamDeleted, offTeamCreated, offTeamUpdated, offTeamDeleted, teams, optimisticUpdates, router]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      fetchTeams();
    }
  }, [status, router, fetchTeams]);

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

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teams...</p>
          {!isConnected && (
            <p className="text-sm text-gray-500 mt-2">Establishing real-time connection...</p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading teams: {error}</p>
          <Button onClick={fetchTeams}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
            {isConnected && (
              <Badge variant="secondary" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Live
              </Badge>
            )}
          </div>
          <p className="text-gray-600">
            Manage your team memberships and collaborations
            {isConnected && (
              <span className="text-sm text-green-600 ml-2">
                Real-time updates active
              </span>
            )}
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create New Team
        </Button>
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No teams yet</h3>
            <p className="text-gray-600 mb-6">Create your first team to start collaborating with others</p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <TeamCard 
              key={team.id} 
              team={team}
              isOptimistic={optimisticUpdates.has(team.id)}
              onUpdate={handleUpdateTeam}
              onDelete={handleDeleteTeam}
              onClick={() => router.push(`/teams/${team.id}`)}
            />
          ))}
        </div>
      )}

      {/* AdSense Placeholder - Banner size between team grid and footer */}
      <div className="mt-12 mb-8">
        <AdSensePlaceholder size="banner" />
      </div>

      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTeam}
      />
    </div>
  );
}