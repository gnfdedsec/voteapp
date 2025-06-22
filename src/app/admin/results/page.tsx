"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Sarabun } from 'next/font/google';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const sarabun = Sarabun({ subsets: ["thai", "latin"], weight: ["400", "700"], variable: "--font-sarabun" });

const CHOICES = [
  "แบบที่ 1", "แบบที่ 2", "แบบที่ 3", "แบบที่ 4",
  "แบบที่ 5", "แบบที่ 6", "แบบที่ 7", "ฉันไม่มีความเห็นใดๆ",
];

interface VotedUser {
  user_id: string;
  email: string;
  full_name: string;
  choice_1: number;
  choice_2: number | null;
  is_no_opinion: boolean;
  created_at: string;
}

export default function AdminResultsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [votedUsers, setVotedUsers] = useState<VotedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    if (!user) {
      // Don't do anything if there's no user yet.
      // The authLoading check will handle showing the loading spinner.
      return;
    }
    
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchVotedUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('voted_users')
          .select('*')
          .order('created_at', { ascending: false })
          .abortSignal(signal);

        if (error) {
          // Re-throw if it's not an AbortError
          if (error.name !== 'AbortError') {
            throw error;
          }
        } else {
            setVotedUsers(data || []);
        }
      } catch (err: any) {
        // Catch re-thrown errors and other exceptions
        if (err.name !== 'AbortError') {
            console.error("Error fetching voted users:", err);
            if (err.message.includes('Auth session missing')) {
                setError('เซสชั่นหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
            } else {
                setError(`ไม่สามารถดึงข้อมูลได้: ${err.message}`);
            }
        }
      } finally {
        // Only set loading to false if the request was not aborted
        // because another one is about to start.
        if (!signal.aborted) {
            setLoading(false);
        }
      }
    };

    fetchVotedUsers();

    return () => {
      controller.abort();
    };
  }, [user, authLoading, router]);

  const formatVote = (user: VotedUser) => {
    if (user.is_no_opinion) {
      return CHOICES[7];
    }
    const votes = [user.choice_1, user.choice_2]
      .filter(c => c !== null)
      .map(c => CHOICES[c!]);
    return votes.join(', ');
  };

  // Show a loading indicator while checking authentication status
  if (authLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-gray-600"></div>
            <p className={`mt-4 text-lg text-gray-700 ${sarabun.variable}`} style={{ fontFamily: 'Sarabun, sans-serif' }}>กำลังตรวจสอบสิทธิ์...</p>
        </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-100 p-4 sm:p-8 ${sarabun.variable}`} style={{ fontFamily: 'Sarabun, sans-serif' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">ผลการโหวตทั้งหมด</h1>
            <Link href="/" className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
                กลับไปหน้าหลัก
            </Link>
        </div>

        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-600">กำลังโหลดข้อมูล...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-600 bg-red-50">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ชื่อ-นามสกุล
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      อีเมล
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ผลโหวต
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      เวลาที่โหวต
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {votedUsers.length > 0 ? (
                    votedUsers.map((user) => (
                      <tr key={user.user_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.full_name || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {formatVote(user)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleString('th-TH')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        ยังไม่มีผู้โหวต
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}