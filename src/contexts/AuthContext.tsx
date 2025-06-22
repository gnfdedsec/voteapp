"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  hasVoted: boolean;
  userVotes: number[];
  checkVoteStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVotes, setUserVotes] = useState<number[]>([]);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await checkVoteStatus();
      }
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await checkVoteStatus();
        } else {
          setHasVoted(false);
          setUserVotes([]);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const checkVoteStatus = async () => {
    if (!user?.id) return;

    try {
      // Check if user has voted
      const { data: voteData, error: voteError } = await supabase
        .from('votes')
        .select('choice_1, choice_2, is_no_opinion')
        .eq('user_id', user.id)
        .single();

      if (voteError && voteError.code !== 'PGRST116') {
        throw voteError;
      }

      if (voteData) {
        setHasVoted(true);
        const votes: number[] = [];
        
        if (voteData.is_no_opinion) {
          votes.push(7); // "ฉันไม่มีความเห็นใดๆ"
        } else {
          if (voteData.choice_1 !== null) votes.push(voteData.choice_1);
          if (voteData.choice_2 !== null) votes.push(voteData.choice_2);
        }
        
        setUserVotes(votes);
      } else {
        setHasVoted(false);
        setUserVotes([]);
      }
    } catch (error) {
      console.error('Error checking vote status:', error);
      setHasVoted(false);
      setUserVotes([]);
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signOut,
    hasVoted,
    userVotes,
    checkVoteStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 