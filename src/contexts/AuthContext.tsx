
import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata: Record<string, string>) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Using setTimeout to prevent deadlock with Supabase auth state change
          setTimeout(async () => {
            const { data } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .maybeSingle();
            setIsAdmin(data?.role === 'admin');
            setLoading(false);
          }, 0);
        } else {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    );

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            setIsAdmin(data?.role === 'admin');
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    toast({
      title: "Welcome back!",
      description: "You have successfully signed in.",
    });
  };

  const signUp = async (email: string, password: string, metadata: Record<string, string>) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    if (error) throw error;
    
    toast({
      title: "Account created",
      description: "Your account has been successfully created!",
    });
  };

  const signOut = async () => {
    // Perform signOut using Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive"
      });
      return;
    }
    
    // Reset all auth state
    setSession(null);
    setUser(null);
    setIsAdmin(false);
    
    // Redirect to auth page
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
    
    // Explicitly navigate to auth page after logout
    navigate('/auth');
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      isAdmin, 
      loading, 
      signIn, 
      signUp, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
