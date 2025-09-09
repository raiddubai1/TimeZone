"use client";

import { useState } from "react";
import { User } from "@/types/admin";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserCheck, UserX, AlertTriangle } from "lucide-react";

interface UserStatusModalProps {
  user: User | null;
  newStatus: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserStatusModal({ 
  user, 
  newStatus, 
  isOpen, 
  onClose, 
  onSuccess 
}: UserStatusModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        console.error("Failed to update user status:", result.error);
        alert(`Failed to update user status: ${result.error}`);
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("An error occurred while updating user status");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <Badge className="bg-green-100 text-green-800">Active</Badge>
      : <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
  };

  const getNewStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <Badge className="bg-green-100 text-green-800">Active</Badge>
      : <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {newStatus ? (
              <UserCheck className="h-5 w-5 text-green-600" />
            ) : (
              <UserX className="h-5 w-5 text-red-600" />
            )}
            <span>
              {newStatus ? "Activate User" : "Deactivate User"}
            </span>
          </DialogTitle>
          <DialogDescription>
            {newStatus 
              ? "This user will regain access to the application and all their permissions will be restored."
              : "This user will lose access to the application immediately. They will not be able to log in or access any features."
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">
                {user?.name?.charAt(0) || user?.email?.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-medium">{user?.name || "Unknown User"}</p>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Status</label>
              {getStatusBadge(user?.isActive || false)}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">New Status</label>
              {getNewStatusBadge(newStatus)}
            </div>
          </div>

          <div className={`border rounded-lg p-3 ${
            newStatus 
              ? "bg-green-50 border-green-200" 
              : "bg-red-50 border-red-200"
          }`}>
            <div className="flex items-start space-x-2">
              <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                newStatus ? "text-green-600" : "text-red-600"
              }`} />
              <div className="text-sm">
                <p className={`font-medium ${
                  newStatus ? "text-green-800" : "text-red-800"
                }`}>
                  {newStatus ? "User Activation" : "User Deactivation"}
                </p>
                <p className={`mt-1 ${
                  newStatus ? "text-green-700" : "text-red-700"
                }`}>
                  {newStatus 
                    ? "The user will receive an email notification about their account activation."
                    : "The user will be immediately logged out if they are currently active."
                  }
                </p>
              </div>
            </div>
          </div>

          {!newStatus && user?.role === "admin" && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800">
                <strong>Note:</strong> Deactivating an admin user may affect system administration capabilities.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            variant={newStatus ? "default" : "destructive"}
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {newStatus ? "Activate User" : "Deactivate User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}