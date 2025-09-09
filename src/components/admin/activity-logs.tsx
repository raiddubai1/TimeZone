"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, 
  User, 
  LogIn, 
  LogOut, 
  Calendar, 
  Settings,
  RefreshCw,
  Clock,
  AlertCircle
} from "lucide-react";
import { io, Socket } from "socket.io-client";

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

export default function ActivityLogs() {
  const { data: session, status } = useSession();
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch activity logs
  const fetchActivityLogs = async () => {
    try {
      const response = await fetch('/api/admin/logs');
      if (!response.ok) {
        throw new Error('Failed to fetch activity logs');
      }
      const data = await response.json();
      setActivityLogs(data);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchActivityLogs();
    }
  }, [status]);

  // Socket.IO connection for real-time updates
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        console.log('Connected to Socket.IO for activity logs');
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
        console.log('Disconnected from Socket.IO');
      });

      // Listen for new activity logs
      newSocket.on('new-activity-log', (newLog: ActivityLog) => {
        setActivityLogs(prevLogs => [newLog, ...prevLogs.slice(0, 49)]); // Keep only last 50 logs
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [status, session]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login':
        return <LogIn className="h-4 w-4" />;
      case 'logout':
        return <LogOut className="h-4 w-4" />;
      case 'meeting_created':
        return <Calendar className="h-4 w-4" />;
      case 'preference_updated':
        return <Settings className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'login':
        return 'bg-green-100 text-green-800';
      case 'logout':
        return 'bg-red-100 text-red-800';
      case 'meeting_created':
        return 'bg-blue-100 text-blue-800';
      case 'preference_updated':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Activity Logs</span>
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Live" : "Offline"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Activity Logs</span>
              <Badge variant="secondary">Offline</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">Error loading activity logs: {error}</p>
              <Button onClick={fetchActivityLogs} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Activity Logs</span>
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Live" : "Offline"}
              </Badge>
            </CardTitle>
            <Button onClick={fetchActivityLogs} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activityLogs.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No activity logs found</p>
              <p className="text-sm text-gray-500">Activity will appear here as users interact with the system</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] w-full">
              <div className="space-y-2">
                {activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {/* Action Icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActionColor(log.action)}`}>
                      {getActionIcon(log.action)}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {log.user ? log.user.name : 'Anonymous'}
                        </span>
                        {log.user && (
                          <Badge variant="outline" className={`text-xs ${getRoleBadgeColor(log.user.role)}`}>
                            {log.user.role}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{log.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{formatTimestamp(log.timestamp)}</span>
                        {log.ipAddress && (
                          <span className="text-xs text-gray-400">• {log.ipAddress}</span>
                        )}
                      </div>
                    </div>

                    {/* Action Badge */}
                    <Badge variant="outline" className="text-xs">
                      {log.action.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}