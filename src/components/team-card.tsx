"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, User, Crown, Shield, ArrowRight, Loader2 } from "lucide-react";

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

interface TeamCardProps {
  team: Team;
  onClick: () => void;
  onUpdate?: (teamId: string, updates: { name?: string; description?: string }) => void;
  onDelete?: (teamId: string) => void;
  isOptimistic?: boolean;
}

export function TeamCard({ team, onClick, onUpdate, onDelete, isOptimistic = false }: TeamCardProps) {
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

  return (
    <Card 
      className={`hover:shadow-lg transition-all duration-300 cursor-pointer group border border-gray-200 hover:border-gray-300 ${
        isOptimistic ? 'opacity-70 animate-pulse' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className={`text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors ${
            isOptimistic ? 'flex items-center gap-2' : ''
          }`}>
            {team.name}
            {isOptimistic && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
          </CardTitle>
          <div className="flex items-center gap-1">
            {getRoleIcon(team.membership.role)}
            <Badge variant={getRoleBadgeVariant(team.membership.role)} className="text-xs">
              {team.membership.role}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Description */}
        {team.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {team.description}
          </p>
        )}

        {/* Team Info */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-4 h-4" />
              <span>{team.memberCount} member{team.memberCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="text-gray-500">
              Created {formatDate(team.createdAt)}
            </div>
          </div>
          
          <div className="text-sm">
            <span className="text-gray-600">Owner: </span>
            <span className="text-gray-900 font-medium">
              {team.owner.name || team.owner.email}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-4">
          {onUpdate && (team.membership.role === "OWNER" || team.membership.role === "ADMIN") && (
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Implement edit modal or inline editing
                console.log("Edit team:", team.id);
              }}
              disabled={isOptimistic}
            >
              Edit
            </Button>
          )}
          {onDelete && team.membership.role === "OWNER" && (
            <Button 
              variant="destructive" 
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete "${team.name}"?`)) {
                  onDelete(team.id);
                }
              }}
              disabled={isOptimistic}
            >
              Delete
            </Button>
          )}
        </div>

        {/* View Team Button */}
        <Button 
          variant="outline" 
          className="w-full group-hover:bg-blue-50 group-hover:border-blue-300 group-hover:text-blue-700 transition-all duration-200"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          disabled={isOptimistic}
        >
          {isOptimistic ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              View Team
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}