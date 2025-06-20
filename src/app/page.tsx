"use client";
import { useState, useEffect } from "react";
import { PiNewspaperThin } from "react-icons/pi";
import { BiNetworkChart } from "react-icons/bi";
import { FaRegThumbsUp } from "react-icons/fa";
import { FaRegLightbulb } from "react-icons/fa";
import { MdHowToVote } from "react-icons/md";
import { Inter, Roboto_Mono, Sarabun } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["400", "700"],
  variable: "--font-sarabun",
});

const CHOICES = [
  "แบบที่ 1",
  "แบบที่ 2",
  "แบบที่ 3",
  "แบบที่ 4",
  "แบบที่ 5",
  "แบบที่ 6",
  "แบบที่ 7",
  "ฉันไม่มีความคิดเห็นใดๆ",
];

export default function Home() {
  const [selected, setSelected] = useState<number[]>([]);
  const [results, setResults] = useState<number[] | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [daysLeft, setDaysLeft] = useState(0);

  // กำหนดวันสิ้นสุด
  useEffect(() => {
    const end = new Date("2024-06-30T00:00:00+07:00").getTime();
    const timer = setInterval(() => {
      const now = new Date().getTime();
      let diff = end - now;
      if (diff < 0) diff = 0;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);
      setDaysLeft(days);
      setTimeLeft(
        (days > 0 ? days + " วัน " : "") +
        (hours < 10 ? "0" : "") + hours + ":" +
        (mins < 10 ? "0" : "") + mins + ":" +
        (secs < 10 ? "0" : "") + secs
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSelect = (idx: number) => {
    if (idx === 7) {
      // ถ้าเลือก 'ฉันไม่มีความคิดเห็นใดๆ' ให้เลือกได้แค่ปุ่มเดียว
      setSelected(selected.includes(7) ? [] : [7]);
    } else {
      // ถ้าเลือกตัวเลือกอื่น
      if (selected.includes(7)) {
        // ถ้าเลือก 'ฉันไม่มีความคิดเห็นใดๆ' อยู่ ให้เปลี่ยนเป็นตัวเลือกใหม่
        setSelected([idx]);
      } else if (selected.includes(idx)) {
        setSelected(selected.filter((i) => i !== idx));
      } else if (selected.length < 2) {
        setSelected([...selected, idx]);
      }
    }
  };

  const handleVote = () => {
    if (selected.length !== 2 && !(selected.length === 1 && selected[0] === 7)) return;
    const newResults = Array(CHOICES.length).fill(0);
    if (selected.length === 1 && selected[0] === 7) {
      // ถ้าเลือกงดแสดงความคิดเห็น ให้ +1 เฉพาะช่องนี้
      newResults[7] = 1;
    } else {
      selected.forEach((idx) => {
        newResults[idx] = 1;
      });
    }
    setResults((prev) => {
      if (!prev) return newResults;
      return prev.map((v, i) => v + newResults[i]);
    });
    setSelected([]);
  };

  // หาคะแนนรวมสูงสุดเพื่อแสดง bar
  const maxVotes = results ? Math.max(...results, 1) : 1;
  const totalVotes = results ? results.reduce((a, b) => a + b, 0) : 0;

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-white p-4"
      style={{
        backgroundImage: "url('/building.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      {/* ป้ายไฟนีออนแบบเส้น We are ENKKU + แสงแดงเคลื่อนผ่าน ENKKU */}
      <div className="w-full flex justify-center gap-6 mb-8">
        {/* การ์ดหลัก */}
        <div className="relative">
          <h1
            className="text-5xl sm:text-7xl tracking-widest select-none flex flex-wrap items-center gap-2"
            style={{
              fontWeight: 900,
              letterSpacing: '0.15em',
              background: 'none',
              animation: 'neon-line-blink 2.2s ease-in-out infinite',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ color: '#800000', whiteSpace: 'nowrap' }}>We are</span>{' '}
            <span
              className="relative inline-block neon-sweep"
              style={{
                color: '#fff',
                WebkitTextStroke: '2.5px #800000',
                textShadow: '0 0 6px #800000, 0 0 2px #fff',
                whiteSpace: 'nowrap',
              }}
            >
              ENKKU
              <span className="pointer-events-none absolute inset-0 z-10 neon-sweep-effect" aria-hidden="true"></span>
            </span>
          </h1>
          <div className="w-full text-center mt-2">
            <span className={`text-xs sm:text-sm font-normal text-[#000000] drop-shadow ${sarabun.variable}`} style={{ fontFamily: 'Sarabun, sans-serif' }}>
              ENKKU VOICE SYSTEM โพลสำรวจ ความคิดเห็นเกี่ยวกับ ENKKU
            </span>
          </div>
          <style>{`
            @keyframes neon-line-blink {
              0%, 100% { filter: brightness(1.1); }
              50% { filter: brightness(1.35); }
            }
            .neon-sweep-effect {
              display: block;
              content: '';
              position: absolute;
              top: 0; left: 0; right: 0; bottom: 0;
              background: linear-gradient(120deg, transparent 0%, rgba(255,0,64,0.18) 35%, rgba(255,0,64,0.45) 50%, rgba(255,0,64,0.18) 65%, transparent 100%);
              mix-blend-mode: lighten;
              pointer-events: none;
              border-radius: 0.25em;
              animation: sweep-red-light 2.5s linear infinite;
            }
            @keyframes sweep-red-light {
              0% { transform: translateX(-80%); opacity: 0.2; }
              20% { opacity: 0.7; }
              50% { transform: translateX(100%); opacity: 0.7; }
              100% { transform: translateX(120%); opacity: 0; }
            }
          `}</style>
        </div>
        {/* การ์ดเวลานับถอยหลัง */}
     
      </div>
      <div className="bg-white/90 shadow-xl rounded-2xl px-8 py-10 w-full max-w-xl flex flex-col items-center gap-8 border-t-4 border-[#800000]">
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@700&display=swap" rel="stylesheet" />
        <h2
          className={`text-3xl font-extrabold mb-2 drop-shadow text-black ${sarabun.variable}`}
          style={{ fontFamily: 'Sarabun, sans-serif' }}
        >
          <span className="inline-flex items-center gap-2 text-black" style={{ fontFamily: 'Sarabun, sans-serif' }}>
            <FaRegLightbulb size={45} color="#000000" />
            สำหรับคณะผู้บริหาร คณะวิศวกรรมศาสตร์  มข. <br/>
          </span>
          <span className="text-black" style={{ fontFamily: 'Sarabun, sans-serif', fontSize: '1.2rem', fontWeight: 100 }}>
            1.เลือกดูแบบโครงสร้างเว็บคณะ (ธีม)  เว็บไซต์คณะวิศวกรรม มข.ที่กำลังจะพัฒนา ที่ท่านชื่นชอบมากที่สุด 2 แบบ
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
                {num === 1 ? (
                  <img src="/model1.jpg" alt="แบบที่ 1" className="w-28 h-28 object-cover rounded-xl shadow mb-2" />
                ) : num === 2 ? (
                  <img src="/model2.jpg" alt="แบบที่ 2" className="w-28 h-28 object-cover rounded-xl shadow mb-2" />
                ) : num === 3 ? (
                  <img src="/model3.jpg" alt="แบบที่ 3" className="w-28 h-28 object-cover rounded-xl shadow mb-2" />
                ) : num === 4 ? (
                  <img src="/model4.jpg" alt="แบบที่ 4" className="w-28 h-28 object-cover rounded-xl shadow mb-2" />
                ) : num === 5 ? (
                  <img src="/model5.jpg" alt="แบบที่ 5" className="w-28 h-28 object-cover rounded-xl shadow mb-2" />
                ) : num === 6 ? (
                  <img src="/model6.jpg" alt="แบบที่ 6" className="w-28 h-28 object-cover rounded-xl shadow mb-2" />
                ) : num === 7 ? (
                  <img src="/model7.jpg" alt="แบบที่ 7" className="w-28 h-28 object-cover rounded-xl shadow mb-2" />
                ) : (
                  <img src={`/example${num}.jpg`} alt={`แบบที่ ${num}`} className="w-full max-w-xs rounded-xl shadow mb-2" />
                )}
                <a
                  href={links[num-1]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-sm bg-white text-black border border-black rounded hover:border-2 transition hover:cursor-pointer"
                >
                  ดูตัวอย่าง แบบที่ : {num}
                </a>
           </div>
          
            );
          })}
        </div>
        {results === null ? (
          <>
            <div className="text-center mb-4 inline-flex items-center gap-2 justify-center text-black">
              <span className={`text-black ${sarabun.variable}`} style={{ fontFamily: 'Sarabun, sans-serif', fontSize: '1.2rem', fontWeight: 100 }}>
                2. ล็อกอินด้วย อีเมล์ kku โหวตแบบเว็บที่ท่านชื่นชอบที่สุด 2 แบบ
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              {CHOICES.map((choice, idx) => (
                <button
                  key={idx}
                  className={`transition-all duration-150 px-4 py-3 rounded-xl border-2 text-lg font-semibold shadow-sm hover:scale-105 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300
                    ${selected.includes(idx)
                      ? idx >= 0 && idx <= 7
                        ? "bg-[#800000] text-white border-[#800000] shadow-lg"
                        : "bg-gradient-to-r from-blue-500 to-pink-400 text-white border-blue-500 shadow-lg"
                      : "bg-white border-gray-200 text-gray-700"}
                    ${(selected.length === 2 && !selected.includes(idx) && idx !== 7) || (selected.includes(7) && idx !== 7) || (selected.length === 1 && selected.includes(7) && idx !== 7) ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => handleSelect(idx)}
                  disabled={selected.length === 2 && !selected.includes(idx)}
                >
                  <span className="inline-flex items-center gap-2"><FaRegThumbsUp size={20}  /> {choice}</span>
                </button>
              ))}
            </div>
            <button
              className="mt-6 px-10 py-3 bg-[#800000] text-white text-xl font-bold rounded-full shadow-lg hover:bg-[#660000] transition-all disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              onClick={handleVote}
              disabled={selected.length !== 2 && !(selected.length === 1 && selected[0] === 7)}
            >
              โหวต
            </button>
          </>
        ) : (
          <div className="w-full flex flex-col items-center gap-6">
            <h2 className="text-2xl font-bold text-blue-700 mb-2">ผลโหวต</h2>
            <div className="w-full flex flex-col gap-3">
              {CHOICES.map((choice, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">{choice}</span>
                    <span className="font-bold text-blue-700">{results[idx]}</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-400 to-pink-400 transition-all"
                      style={{ width: `${(results[idx] / maxVotes) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-gray-500 mt-2">โหวตรวมทั้งหมด: <span className="font-bold text-blue-700">{totalVotes}</span> ครั้ง</div>
            <button
              className="mt-4 px-8 py-2 bg-gradient-to-r from-blue-500 to-pink-500 text-white font-bold rounded-full shadow hover:from-blue-600 hover:to-pink-600 transition-all"
              onClick={() => setResults(null)}
            >
              โหวตใหม่
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
