
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LoaderCircle } from "lucide-react";

const AdminSignup = () => {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Admin123");
  const [username, setUsername] = useState("admin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoCreated, setDemoCreated] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Check if demo admin already exists
  useEffect(() => {
    const checkDemoAdmin = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', 'admin')
        .maybeSingle();
      
      if (data) {
        setDemoCreated(true);
        toast({
          title: "Demo admin already exists",
          description: "A demo admin account already exists in the system.",
        });
      }
    };
    
    checkDemoAdmin();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            role: 'admin'
          }
        }
      });

      if (error) throw error;

      // Update the profile to set role as admin
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', data.user?.id);

      if (profileError) throw profileError;

      toast({
        title: "Demo admin account created",
        description: "You can now log in with the demo admin credentials.",
      });
      
      setDemoCreated(true);
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create Demo Admin Account</h1>
          <p className="text-muted-foreground mt-2">Set up a demo admin account for testing</p>
        </div>

        {demoCreated ? (
          <div className="bg-green-50 border border-green-200 p-6 rounded-md text-center">
            <h2 className="font-medium text-green-800 text-lg">Demo Admin Available!</h2>
            <p className="mt-2 text-green-700">
              Login with:
              <br />
              Email: admin@example.com
              <br />
              Password: Admin123
            </p>
            <Button 
              onClick={() => navigate('/auth')}
              className="mt-4"
            >
              Go to Login Page
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Creating demo admin...
                </>
              ) : (
                'Create Demo Admin'
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminSignup;
