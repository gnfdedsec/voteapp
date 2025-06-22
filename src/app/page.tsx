"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { FaRegThumbsUp, FaRegLightbulb, FaGoogle } from "react-icons/fa";
import { Inter, Roboto_Mono, Sarabun } from "next/font/google";
import Link from 'next/link';

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const robotoMono = Roboto_Mono({ variable: "--font-roboto-mono", subsets: ["latin"] });
const sarabun = Sarabun({ subsets: ["thai", "latin"], weight: ["400", "700"], variable: "--font-sarabun" });

const CHOICES = [
  "แบบที่ 1", "แบบที่ 2", "แบบที่ 3", "แบบที่ 4",
  "แบบที่ 5", "แบบที่ 6", "แบบที่ 7", "ฉันไม่มีความเห็นใดๆ",
];

export default function Home() {
  // Make sure signOut is properly destructured from useAuth
  const { 
    user, 
    signInWithGoogle, 
    signOut, // Ensure this exists in your AuthContext
    loading, 
    hasVoted, 
    userVotes, 
    checkVoteStatus 
  } = useAuth();

  const [selected, setSelected] = useState<number[]>([]);
  const [results, setResults] = useState<number[] | null>(null);
  const [mounted, setMounted] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loadingResults, setLoadingResults] = useState(false);
  const [voting, setVoting] = useState(false);
  const [message, setMessage] = useState('');
  const [isEmailAllowed, setIsEmailAllowed] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user?.email) {
      setIsEmailAllowed(false);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const checkEmailPermission = async () => {
      setCheckingEmail(true);
      setMessage(''); // Clear previous messages
      try {
        const { data, error } = await supabase
          .from('allowed_emails')
          .select('email, full_name, department, position')
          .eq('email', user.email)
          .eq('is_active', true)
          .abortSignal(signal)
          .single();

        if (error) {
           if (error.name !== 'AbortError') {
            throw error;
          }
        } else {
            setIsEmailAllowed(true);
            setMessage(`ยินดีต้อนรับ ${data.full_name} (${data.department})`);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
            console.error('Error checking email permission:', err);
            setIsEmailAllowed(false);
            setMessage('อีเมล์ของคุณไม่ได้รับอนุญาตให้โหวต กรุณาติดต่อผู้ดูแลระบบ');
        }
      } finally {
        if (!signal.aborted) {
            setCheckingEmail(false);
        }
      }
    };

    checkEmailPermission();

    return () => {
      controller.abort();
    };
  }, [user]);

  const fetchVoteResults = async () => {
    setLoadingResults(true);
    setMessage('');
    try {
      const { data, error } = await supabase
        .from('vote_results')
        .select('choice_number, vote_count')
        .order('choice_number');

      if (error) throw error;
      
      const resultsArray = CHOICES.map((_, idx) => {
        const result = data?.find(d => d.choice_number === idx);
        return result?.vote_count || 0;
      });
      setResults(resultsArray);
      setTotalVotes(resultsArray.reduce((acc, cur) => acc + cur, 0));

    } catch (err: any) {
      console.error('Error fetching vote results:', err);
      setMessage(`Error fetching results: ${err.message}`);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleSelect = (idx: number) => {
    if (hasVoted || !isEmailAllowed) return;
    if (idx === 7) {
      setSelected(selected.includes(7) ? [] : [7]);
    } else {
      if (selected.includes(7)) {
        setSelected([idx]);
      } else if (selected.includes(idx)) {
        setSelected(selected.filter((i) => i !== idx));
      } else if (selected.length < 2) {
        setSelected([...selected, idx]);
      }
    }
  };

  const handleVote = async () => {
    if (!user || !isEmailAllowed) {
      setMessage('กรุณาเข้าสู่ระบบด้วยอีเมล์ที่ได้รับอนุญาต');
      return;
    }
    
    if (selected.length === 0) { 
      setMessage('กรุณาเลือกอย่างน้อย 1 ตัวเลือก'); 
      return; 
    }
    if (selected.length > 2) { 
      setMessage('กรุณาเลือกไม่เกิน 2 ตัวเลือก'); 
      return; 
    }
    if (selected.length === 2 && selected.includes(7)) { 
      setMessage('ไม่สามารถเลือก "ฉันไม่มีความเห็นใดๆ" พร้อมกับตัวเลือกอื่นได้'); 
      return; 
    }
    if (hasVoted) { 
      setMessage('คุณได้โหวตแล้ว'); 
      return; 
    }

    setVoting(true);
    setMessage('');

    try {
      // Step 1: Ensure user profile exists
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // Profile does not exist, so create it
        const { error: insertError } = await supabase.from('user_profiles').insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name,
          avatar_url: user.user_metadata?.avatar_url,
        });
        if (insertError) {
          throw new Error(`Failed to create user profile: ${insertError.message}`);
        }
      } else if (profileError) {
        throw profileError;
      }

      // Step 2: Insert the vote
      const voteData = {
        user_id: user.id,
        choice_1: selected[0],
        choice_2: selected.length > 1 ? selected[1] : null,
        is_no_opinion: selected.includes(7)
      };

      const { error } = await supabase
        .from('votes')
        .insert([voteData]);

      if (error) {
        if (error.message.includes('duplicate key')) {
          console.warn('Duplicate vote detected, forcing state refresh.');
          setMessage('คุณได้โหวตไปแล้ว กำลังรีเฟรชสถานะ...');
          await checkVoteStatus();
          return;
        }
        throw error;
      }

      setMessage('✅ Vote submitted successfully!');
      await checkVoteStatus();
      await fetchVoteResults();
      
    } catch (err: any) {
      console.error('Vote Error:', err);
      setMessage(`เกิดข้อผิดพลาดที่ไม่คาดคิด: ${err.message}`);
      setVoting(false);
    }
  };

  const resetVote = () => {
    setResults(null);
    setTotalVotes(0);
    setSelected([]);
    setMessage('');
  };

  // Add a fallback signOut function if it's not available from context
  const handleSignOut = async () => {
    if (signOut) {
      await signOut();
    } else {
      // Fallback: direct supabase signout
      await supabase.auth.signOut();
      window.location.reload();
    }
  };
  
  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#800000]"></div>
        <p className={`mt-4 text-lg text-gray-600 ${sarabun.variable}`} style={{ fontFamily: 'Sarabun, sans-serif' }}>
          กำลังโหลด...
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#800000]"></div>
        <p className={`mt-4 text-lg text-gray-600 ${sarabun.variable}`} style={{ fontFamily: 'Sarabun, sans-serif' }}>
          กำลังตรวจสอบการเข้าสู่ระบบ...
        </p>
      </div>
    );
  }
  
  const maxVotes = results ? Math.max(...results.filter(v => typeof v === 'number'), 1) : 1;
  const displayTotalVotes = isNaN(totalVotes) ? 0 : totalVotes;

  return (
    <div
      className="flex flex-col items-center min-h-screen bg-white p-4"
      style={{
        backgroundImage: "url('/building.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      <div className="w-full max-w-xl flex justify-center items-center bg-white/50 backdrop-blur-sm p-2 rounded-full shadow-md mb-6 sticky top-4 z-50">
        <span className="font-semibold text-sm text-gray-800">ระบบโหวต ENKKU</span>
      </div>
      
      <div className="w-full flex justify-center gap-6 mb-8">
        <div className="relative">
          <div className="flex items-center justify-center">
            <img 
              src="/enkkulogo.png" 
              alt="ENKKU Logo" 
              className="h-40 sm:h-56 object-contain"
            />
          </div>
          <div className="w-full text-center mt-2">
            <span className={`text-xs sm:text-sm font-normal text-[#000000] drop-shadow ${sarabun.variable}`} style={{ fontFamily: 'Sarabun, sans-serif' }}>
              ENKKU VOICE SYSTEM โพลสำรวจ ความคิดเห็นเกี่ยวกับ ENKKU เท่านั้น
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white/90 shadow-xl rounded-2xl px-8 py-10 w-full max-w-xl flex flex-col items-center gap-8 border-t-4 border-[#800000]">
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@700&display=swap" rel="stylesheet" />
        
        {/* Login Section */}
        {!user ? (
          <div className="w-full flex flex-col items-center gap-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">เข้าสู่ระบบเพื่อโหวต</h2>
            <p className="text-gray-600 text-center mb-4">
              กรุณาเข้าสู่ระบบด้วย EMAIL-KKU Account ที่ได้รับอนุญาต
            </p>
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
            >
              <FaGoogle className="text-red-500" size={20} />
              <span>เข้าสู่ระบบด้วย Email KKU</span>
            </button>
          </div>
        ) : (
          <>
            {/* User Info */}
            <div className="w-full flex items-center justify-between bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                {user.user_metadata?.avatar_url && (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt="Avatar" 
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div>
                  <p className="font-semibold text-gray-800">{user.user_metadata?.full_name || user.email}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* <Link href="/admin/results" className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">
                  ดูผลทั้งหมด
                </Link> */}
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all cursor-pointer"
                >
                  ออกจากระบบ
                </button>
              </div>
            </div>

            {message && (
              <div className={`text-center mb-0 p-3 rounded-lg w-full ${
                message.includes('Error') || message.includes('ไม่ได้รับอนุญาต') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}>
                {message}
              </div>
            )}

            {checkingEmail ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#800000]"></div>
                <p className="mt-2 text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
              </div>
            ) : !isEmailAllowed ? (
              <div className="text-center py-4">
                <p className="text-red-600 font-semibold">อีเมล์ของคุณไม่ได้รับอนุญาตให้โหวต</p>
                <p className="text-gray-600 mt-2">กรุณาติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์</p>
              </div>
            ) : hasVoted ? (
              <div className="w-full flex flex-col items-center gap-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">ขอบคุณสำหรับการโหวต!</h2>
                <p className="text-gray-600">คุณได้โหวตแล้ว: {userVotes.map(v => CHOICES[v]).join(', ')}</p>
                
                {loadingResults ? (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#800000]"></div>
                    <p className="mt-2 text-gray-600">กำลังโหลดผลโหวตล่าสุด...</p>
                  </div>
                ) : results && (
                  <>
                    <div className="w-full flex flex-col gap-3">
                      {CHOICES.map((choice, idx) => (
                        <div key={idx} className="flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700">{choice}</span>
                            <span className="font-bold text-gray-800">{results[idx] ?? 0}</span>
                          </div>
                          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-red-500 to-yellow-500 transition-all"
                              style={{ width: `${results ? ((results[idx] ?? 0) / maxVotes) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-gray-500 mt-2">โหวตรวมทั้งหมด: <span className="font-bold text-gray-800">{displayTotalVotes}</span> ครั้ง</div>
                  </>
                )}
                <button
                  className="mt-4 px-8 py-2 bg-[#800000] text-white font-bold rounded-full shadow hover:bg-[#660000] transition-all"
                  onClick={() => {
                    resetVote();
                    fetchVoteResults();
                  }}
                >
                  ดูผลโหวตล่าสุด
                </button>
              </div>
            ) : (
              <>
                <h2
                  className={`text-3xl font-extrabold mb-2 drop-shadow text-black ${sarabun.variable}`}
                  style={{ fontFamily: 'Sarabun, sans-serif' }}
                >
                  <span className="inline-flex items-center gap-2 text-black" style={{ fontFamily: 'Sarabun, sans-serif' }}>
                    <FaRegLightbulb size={45} color="#000000" />
                    สำรวจความคิดเห็นของคณะผู้บริหาร คณะวิศวกรรมศาสตร์  มข. <br/>
                  </span>
                  <span className="text-black" style={{ fontFamily: 'Sarabun, sans-serif', fontSize: '1.2rem', fontWeight: 100 }}>
                    1.เลือกดูแบบโครงสร้างเว็บคณะ (ธีม)  เว็บไซต์คณะวิศวกรรม มข.ที่กำลังจะพัฒนา ที่ท่านชื่นชอบและมองว่าเหมาะสมที่สุด 2 แบบ
                  </span>
                </h2>

                <div className="w-full mt-4 grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[1,2,3,4,5,6,7].map((num) => {
                    const links = [
                      "https://unipix-project.netlify.app/index-two",
                      "https://templateup.site/eduqe/?storefront=envato-elements",
                      "https://fse.jegtheme.com/schwimm/?storefront=envato-elements",
                      "https://ninzio.com/edukul/?storefront=envato-elements",
                      "https://themazine.com/newwp/edutech/?storefront=envato-elements",
                      "https://www.wordpress.codeinsolution.com/dricademy/?storefront=envato-elements",
                      "https://ongkorn3.seeddemo.com/"
                    ];
                    return (
                      <div key={num} className="flex flex-col items-center">
                        {num === 1 ? <img src="/model1.jpg" alt="แบบที่ 1" className="w-28 h-28 object-cover rounded-xl shadow mb-2" /> :
                         num === 2 ? <img src="/model2.jpg" alt="แบบที่ 2" className="w-28 h-28 object-cover rounded-xl shadow mb-2" /> :
                         num === 3 ? <img src="/model3.jpg" alt="แบบที่ 3" className="w-28 h-28 object-cover rounded-xl shadow mb-2" /> :
                         num === 4 ? <img src="/model4.jpg" alt="แบบที่ 4" className="w-28 h-28 object-cover rounded-xl shadow mb-2" /> :
                         num === 5 ? <img src="/model5.jpg" alt="แบบที่ 5" className="w-28 h-28 object-cover rounded-xl shadow mb-2" /> :
                         num === 6 ? <img src="/model6.jpg" alt="แบบที่ 6" className="w-28 h-28 object-cover rounded-xl shadow mb-2" /> :
                         num === 7 ? <img src="/model7.jpg" alt="แบบที่ 7" className="w-28 h-28 object-cover rounded-xl shadow mb-2" /> :
                         null}
                        <a href={links[num-1]} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-sm bg-white text-black border border-black rounded hover:border-2 transition hover:cursor-pointer">
                          ดูตัวอย่าง แบบที่ : {num}
                        </a>
                      </div>
                    );
                  })}
                </div>
              
                <div className="text-center mb-4 inline-flex items-center gap-2 justify-center text-black">
                  <span className={`text-black ${sarabun.variable}`} style={{ fontFamily: 'Sarabun, sans-serif', fontSize: '1.2rem', fontWeight: 100 }}>
                    2. เลือกแบบเว็บที่ท่านชื่นชอบที่สุด 2 แบบ
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  {CHOICES.map((choice, idx) => (
                    <button
                      key={idx}
                      className={`transition-all duration-150 px-4 py-3 rounded-xl border-2 text-lg font-semibold shadow-sm hover:scale-105
                        ${selected.includes(idx) ? "bg-[#800000] text-white border-[#800000] shadow-lg" : "bg-white border-gray-200 text-gray-700"}
                        ${(selected.length === 2 && !selected.includes(idx) && idx !== 7) || (selected.includes(7) && idx !== 7) ? "opacity-50 cursor-not-allowed" : ""}`}
                      onClick={() => handleSelect(idx)}
                      disabled={(selected.length === 2 && !selected.includes(idx) && idx !== 7) || (selected.includes(7) && idx !== 7)}
                    >
                      <span className="inline-flex items-center gap-2"><FaRegThumbsUp size={20} /> {choice}</span>
                    </button>
                  ))}
                </div>
                <button
                  className="mt-6 px-10 py-3 bg-[#800000] text-white text-xl font-bold rounded-full shadow-lg hover:bg-[#660000] transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                  onClick={handleVote}
                  disabled={selected.length === 0 || voting}
                >
                  {voting ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </span>
                  ) : (
                    'ส่งผลโหวต'
                  )}
                </button>
              </>
            )}
          </>
        )}
</div>
    </div>
  );
}