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
import { Loader2, Trash2, AlertTriangle, Shield } from "lucide-react";

interface UserDeleteModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserDeleteModal({ user, isOpen, onClose, onSuccess }: UserDeleteModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    if (!user || confirmText !== "DELETE") return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        console.error("Failed to delete user:", result.error);
        alert(`Failed to delete user: ${result.error}`);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("An error occurred while deleting user");
    } finally {
      setIsLoading(false);
    }
  };

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

  const isConfirmDisabled = confirmText !== "DELETE";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            <span>Delete User</span>
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the user account and all associated data.
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
              <div className="mt-1">
                <Badge className={getRoleBadgeColor(user?.role || "user")}>
                  {user?.role || "user"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 text-red-600" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">Permanent Data Loss</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>User profile and account information</li>
                  <li>User preferences and settings</li>
                  <li>Associated timezone preferences</li>
                  <li>Meeting history and scheduled meetings</li>
                </ul>
              </div>
            </div>
          </div>

          {user?.role === "admin" && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Shield className="h-4 w-4 mt-0.5 text-orange-600" />
                <div className="text-sm text-orange-800">
                  <p className="font-medium">Admin User Warning</p>
                  <p>Deleting an admin user may affect system administration capabilities.</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Type <span className="font-mono bg-gray-100 px-1 rounded">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Type DELETE to confirm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            disabled={isLoading || isConfirmDisabled}
            variant="destructive"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Delete User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}