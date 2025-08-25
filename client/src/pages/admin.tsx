import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type User } from "@shared/schema";
import { 
  Users, 
  FolderOpen, 
  DollarSign, 
  Activity, 
  Wifi, 
  AlertTriangle,
  TrendingUp,
  Database,
  Search,
  Edit2,
  Trash2,
  MoreHorizontal,
  UserCheck,
  UserX
} from "lucide-react";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string>("all");

  const platformStats = {
    totalUsers: 127,
    activeProjects: 89,
    revenue: 12450,
    monthlyGrowth: 23.5,
  };

  const systemHealth = {
    serverUptime: 99.9,
    activeConnections: 245,
    pendingReviews: 3,
    databaseHealth: "Excellent",
  };

  // Fetch all users for admin panel
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      // Use apiRequest so Authorization header (token) is included and errors are thrown consistently
      const res = await apiRequest("GET", "/api/admin/users");
      const payload = await res.json();
      return Array.isArray(payload) ? payload : [];
    },
  });

  // User management mutations
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<User> }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Updated",
        description: "User information has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update user information.",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Deleted",
        description: "User has been removed from the platform.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete user.",
        variant: "destructive",
      });
    },
  });

  // Normalize users to an array and filter based on search and plan
  const userList = Array.isArray(users) ? users : [];

  const filteredUsers = userList.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = selectedPlan === "all" || user.plan.toLowerCase() === selectedPlan.toLowerCase();
    return matchesSearch && matchesPlan;
  });

  const handlePlanChange = (userId: string, newPlan: string) => {
    updateUserMutation.mutate({ userId, updates: { plan: newPlan } });
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case "enterprise":
        return "bg-purple-100 text-purple-800";
      case "professional":
        return "bg-blue-100 text-blue-800";
      case "free":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Platform Statistics */}
        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <TrendingUp className="mr-3 text-blue-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">Platform Stats</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users size={20} className="mr-3 text-gray-400" />
                  <span className="text-gray-600">Total Users</span>
                </div>
                <span className="text-2xl font-bold text-gray-900" data-testid="stat-total-users">
                  {platformStats.totalUsers}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FolderOpen size={20} className="mr-3 text-gray-400" />
                  <span className="text-gray-600">Active Projects</span>
                </div>
                <span className="text-2xl font-bold text-gray-900" data-testid="stat-active-projects">
                  {platformStats.activeProjects}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign size={20} className="mr-3 text-gray-400" />
                  <span className="text-gray-600">Monthly Revenue</span>
                </div>
                <span className="text-2xl font-bold text-green-600" data-testid="stat-revenue">
                  ${platformStats.revenue.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp size={20} className="mr-3 text-gray-400" />
                  <span className="text-gray-600">Growth Rate</span>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-green-600">
                    +{platformStats.monthlyGrowth}%
                  </span>
                  <Badge className="ml-2 bg-green-100 text-green-800">
                    This Month
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Activity className="mr-3 text-green-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Wifi size={20} className="mr-3 text-gray-400" />
                  <span className="text-gray-600">Server Uptime</span>
                </div>
                <div className="flex items-center">
                  <span className="text-lg font-semibold text-green-600">
                    {systemHealth.serverUptime}%
                  </span>
                  <span className="ml-2 text-green-600">🟢</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users size={20} className="mr-3 text-gray-400" />
                  <span className="text-gray-600">Active Connections</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {systemHealth.activeConnections}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle size={20} className="mr-3 text-gray-400" />
                  <span className="text-gray-600">Pending Reviews</span>
                </div>
                <div className="flex items-center">
                  <span className="text-lg font-semibold text-orange-600">
                    {systemHealth.pendingReviews}
                  </span>
                  <span className="ml-2 text-orange-600">⚠️</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Database size={20} className="mr-3 text-gray-400" />
                  <span className="text-gray-600">Database Health</span>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {systemHealth.databaseHealth}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card className="shadow-sm border border-gray-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                  data-testid="input-search-users"
                />
              </div>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">User</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Plan</TableHead>
                  <TableHead className="font-semibold">Joined</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      {searchTerm || selectedPlan !== "all" ? "No users found matching the criteria" : "No users found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {user.name.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">@{user.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{user.email}</TableCell>
                      <TableCell>
                        <Select 
                          value={user.plan} 
                          onValueChange={(value) => handlePlanChange(user.id, value)}
                          disabled={updateUserMutation.isPending}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue>
                              <Badge className={getPlanBadgeColor(user.plan)}>
                                {user.plan}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Free">Free</SelectItem>
                            <SelectItem value="Professional">Professional</SelectItem>
                            <SelectItem value="Enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              toast({
                                title: "Edit User",
                                description: "User editing functionality would open here.",
                              });
                            }}
                            data-testid={`button-edit-user-${user.id}`}
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deleteUserMutation.isPending || user.id === "demo-user-id"}
                            data-testid={`button-delete-user-${user.id}`}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length > 0 && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <p>Showing {filteredUsers.length} of {userList.length} users</p>
              <div className="flex items-center space-x-4">
                <span>Total Active: {userList.filter(u => u.plan !== "Free").length}</span>
                <span>Free Users: {userList.filter(u => u.plan === "Free").length}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="shadow-sm border border-gray-100">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          
          <div className="space-y-3">
            {[
              {
                time: "2 minutes ago",
                action: "New user registration",
                details: "sarah.wilson@example.com joined the platform",
                type: "user",
              },
              {
                time: "15 minutes ago",
                action: "Project deployed to marketplace",
                details: "Restaurant POS System by john.doe",
                type: "deployment",
              },
              {
                time: "1 hour ago",
                action: "MCP server connected",
                details: "Payment Gateway server established connection",
                type: "server",
              },
              {
                time: "3 hours ago",
                action: "Subscription upgrade",
                details: "User upgraded to Professional plan",
                type: "billing",
              },
            ].map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 py-3 border-b border-gray-100 last:border-b-0">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === "user" ? "bg-blue-500" :
                  activity.type === "deployment" ? "bg-green-500" :
                  activity.type === "server" ? "bg-purple-500" :
                  "bg-orange-500"
                }`} />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.details}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
