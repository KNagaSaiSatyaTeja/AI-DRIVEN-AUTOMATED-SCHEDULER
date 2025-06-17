import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithProvider: (provider: 'google' | 'github' | 'twitter') => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Demo users for testing
  const demoUsers = [
    { email: 'admin@demo.com', password: 'admin123', id: 'admin-demo' },
    { email: 'user@demo.com', password: 'user123', id: 'user-demo' }
  ];

  useEffect(() => {
    // Check for demo user in localStorage first
    const demoUser = localStorage.getItem('demo-user');
    if (demoUser) {
      const user = JSON.parse(demoUser);
      setUser(user);
      setSession({ user } as Session);
      setLoading(false);
      return;
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithProvider = async (provider: 'google' | 'github' | 'twitter') => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl
      }
    });
    if (error) throw error;
  };

  const signInWithEmail = async (email: string, password: string) => {
    // Check if it's a demo user first
    const demoUser = demoUsers.find(u => u.email === email && u.password === password);
    if (demoUser) {
      const user = { id: demoUser.id, email: demoUser.email } as User;
      setUser(user);
      setSession({ user } as Session);
      localStorage.setItem('demo-user', JSON.stringify(user));
      return { error: null };
    }

    // Otherwise use Supabase
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signOut = async () => {
    // Clear demo user
    localStorage.removeItem('demo-user');
    setUser(null);
    setSession(null);
    
    // Also sign out from Supabase
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signInWithProvider,
    signInWithEmail,
    signUp,
    signOut
  };

  return (
    AuthContext.Provider value={value}>
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
