import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Box, Mail, Lock, Chrome, Github } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("demo@mcpbuilder.com");
  const [password, setPassword] = useState("demo123");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      const data = await response.json();
      // Store token in localStorage for future requests
      if (data.token) {
        localStorage.setItem("authToken", data.token);
      }
      login(data.user);
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="gradient-brand text-white w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Box size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">MCP Builder</h1>
            <p className="text-gray-600 mt-2">Build AI apps with conversation</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="demo@mcpbuilder.com"
                  data-testid="input-email"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  placeholder="••••••••"
                  data-testid="input-password"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full gradient-brand py-3 font-medium hover:opacity-90 transition-opacity"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>

            <div className="text-center">
              <p className="text-gray-500 mb-4">Or continue with</p>
              <div className="flex space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  data-testid="button-google-login"
                >
                  <Chrome className="mr-2 h-4 w-4 text-red-500" />
                  Google
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  data-testid="button-github-login"
                >
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
