"use client";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sarabun } from "next/font/google";
import { FcGoogle } from 'react-icons/fc';

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["400", "700"],
  variable: "--font-sarabun",
});

export default function LoginPage() {
  const { user, signInWithGoogle, isEmailAllowed, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      setIsChecking(true);
      isEmailAllowed(user.email!)
        .then((allowed) => {
          if (allowed) {
            router.push('/');
          } else {
            setError('อีเมลของคุณไม่ได้รับอนุญาตให้เข้าร่วมการโหวตนี้');
            // Log out the user to allow them to try another account
            supabase.auth.signOut();
          }
        })
        .finally(() => {
          setIsChecking(false);
        });
    }
  }, [user, loading, router, isEmailAllowed]);

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Error logging in with Google:', error);
      alert('Login failed. Please try again.');
    }
  };

  if (loading || isChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#800000]"></div>
        <p className={`mt-4 text-lg text-gray-600 ${sarabun.variable}`} style={{ fontFamily: 'Sarabun, sans-serif' }}>
          กำลังตรวจสอบข้อมูล...
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white shadow-lg rounded-xl border">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">ENKKU Voting System</h1>
          <p className="mt-2 text-gray-600">Please sign in to continue</p>
        </div>
        
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <FcGoogle size={24} />
          <span className="text-md font-medium text-gray-700">Sign in with Google</span>
        </button>

        <div className="text-center text-sm text-gray-500">
          <p>Only authorized users can vote.</p>
        </div>
      </div>
    </div>
  );
} 