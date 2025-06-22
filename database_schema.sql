-- =====================================================
-- สร้างตารางทั้งหมดสำหรับระบบโหวต ENKKU
-- =====================================================

-- 1. สร้างตาราง allowed_emails (อีเมล์ที่อนุญาต 8 อีเมล์)
CREATE TABLE public.allowed_emails (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT,
  position TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. สร้างตาราง user_profiles (โปรไฟล์ผู้ใช้)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. สร้างตาราง votes (การโหวต)
CREATE TABLE public.votes (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  choice_1 INTEGER NOT NULL CHECK (choice_1 >= 0 AND choice_1 <= 7),
  choice_2 INTEGER CHECK (choice_2 >= 0 AND choice_2 <= 7),
  is_no_opinion BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 4. สร้างตาราง vote_results (ผลการโหวต)
CREATE TABLE public.vote_results (
  id SERIAL PRIMARY KEY,
  choice_number INTEGER NOT NULL,
  vote_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- เพิ่มข้อมูลเริ่มต้น
-- =====================================================

-- เพิ่มอีเมล์ที่อนุญาต 8 อีเมล์
INSERT INTO public.allowed_emails (email, full_name, department, position) VALUES 
('ssuraw@gmail.com', 'ศ.ดร.สมชาย ใจดี', 'คณะวิศวกรรมศาสตร์', 'คณบดี'),
('vice.dean1@kku.ac.th', 'รศ.ดร.สมหญิง รักดี', 'คณะวิศวกรรมศาสตร์', 'รองคณบดีฝ่ายวิชาการ'),
('vice.dean2@kku.ac.th', 'รศ.ดร.สมศักดิ์ มั่นคง', 'คณะวิศวกรรมศาสตร์', 'รองคณบดีฝ่ายวิจัย'),
('vice.dean3@kku.ac.th', 'รศ.ดร.สมพร สุขใจ', 'คณะวิศวกรรมศาสตร์', 'รองคณบดีฝ่ายกิจการนักศึกษา'),
('secretary@kku.ac.th', 'นางสาวสมศรี ใจเย็น', 'คณะวิศวกรรมศาสตร์', 'เลขานุการคณะ'),
('admin1@kku.ac.th', 'นายสมชาย ทำงาน', 'คณะวิศวกรรมศาสตร์', 'เจ้าหน้าที่บริหาร'),
('admin2@kku.ac.th', 'นางสมหญิง จัดการ', 'คณะวิศวกรรมศาสตร์', 'เจ้าหน้าที่บริหาร'),
('admin3@kku.ac.th', 'นายสมศักดิ์ ดูแล', 'คณะวิศวกรรมศาสตร์', 'เจ้าหน้าที่บริหาร');

-- เพิ่มข้อมูลผลโหวตเริ่มต้น
INSERT INTO public.vote_results (choice_number, vote_count) VALUES 
(0, 0), (1, 0), (2, 0), (3, 0), (4, 0), (5, 0), (6, 0), (7, 0);

-- =====================================================
-- ตั้งค่า Row Level Security (RLS)
-- =====================================================

-- เปิดใช้งาน RLS สำหรับทุกตาราง
ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vote_results ENABLE ROW LEVEL SECURITY;

-- สร้าง policies สำหรับ allowed_emails
CREATE POLICY "Anyone can view allowed emails" ON public.allowed_emails
  FOR SELECT USING (true);

-- สร้าง policies สำหรับ user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- สร้าง policies สำหรับ votes
CREATE POLICY "Users can insert their own vote" ON public.votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own vote" ON public.votes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view vote results" ON public.votes
  FOR SELECT USING (true);

-- เพิ่ม policy สำหรับ admin ให้ดูข้อมูลได้ทั้งหมด
CREATE POLICY "Admin can view all votes" ON public.votes
  FOR SELECT USING (auth.role() = 'authenticated');

-- สร้าง policies สำหรับ vote_results
CREATE POLICY "Anyone can view vote results" ON public.vote_results
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can update vote results" ON public.vote_results
  FOR UPDATE USING (auth.role() = 'authenticated');

-- =====================================================
-- สร้าง Indexes สำหรับประสิทธิภาพ
-- =====================================================

-- Index สำหรับการค้นหาอีเมล์
CREATE INDEX idx_allowed_emails_email ON public.allowed_emails(email);
CREATE INDEX idx_allowed_emails_active ON public.allowed_emails(is_active);

-- Index สำหรับการค้นหาการโหวต
CREATE INDEX idx_votes_user_id ON public.votes(user_id);
CREATE INDEX idx_votes_created_at ON public.votes(created_at);

-- Index สำหรับผลการโหวต
CREATE INDEX idx_vote_results_choice ON public.vote_results(choice_number);

-- =====================================================
-- สร้าง Triggers สำหรับ updated_at
-- =====================================================

-- Function สำหรับอัปเดต updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger สำหรับ allowed_emails
CREATE TRIGGER update_allowed_emails_updated_at 
    BEFORE UPDATE ON public.allowed_emails 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger สำหรับ user_profiles
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- สร้าง Function สำหรับอัปเดตผลการโหวต
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_vote_results()
RETURNS TRIGGER AS $$
BEGIN
    -- This function now runs with the permissions of the user who defined it (the owner),
    -- allowing it to bypass RLS policies and update the aggregate results table.

    -- First, clear the existing summary. TRUNCATE is faster than DELETE.
    TRUNCATE public.vote_results;
    
    -- Recalculate and insert the fresh vote counts.
    INSERT INTO public.vote_results (choice_number, vote_count)
    SELECT 
        all_votes.choice_number,
        COUNT(*) as vote_count
    FROM (
        -- Combine all valid votes into a single column
        SELECT choice_1 as choice_number FROM public.votes WHERE is_no_opinion = false
        UNION ALL
        SELECT choice_2 as choice_number FROM public.votes WHERE choice_2 IS NOT NULL AND is_no_opinion = false
        UNION ALL
        -- Handle the 'no opinion' vote as choice 7
        SELECT 7 as choice_number FROM public.votes WHERE is_no_opinion = true
    ) all_votes
    WHERE all_votes.choice_number IS NOT NULL
    GROUP BY all_votes.choice_number;
    
    -- For an AFTER trigger, the return value is ignored. NULL is standard.
    RETURN NULL;
END;
$$ 
LANGUAGE plpgsql 
SECURITY DEFINER;

-- Trigger สำหรับอัปเดตผลการโหวตอัตโนมัติ
-- Re-create the trigger to ensure it's linked to the updated function and runs once per statement.
DROP TRIGGER IF EXISTS trigger_update_vote_results ON public.votes;
CREATE TRIGGER trigger_update_vote_results
    AFTER INSERT OR UPDATE OR DELETE ON public.votes
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.update_vote_results();

-- =====================================================
-- สร้าง View สำหรับดูผลการโหวต
-- =====================================================

CREATE VIEW public.vote_summary AS
SELECT 
    vr.choice_number,
    CASE 
        WHEN vr.choice_number = 0 THEN 'แบบที่ 1'
        WHEN vr.choice_number = 1 THEN 'แบบที่ 2'
        WHEN vr.choice_number = 2 THEN 'แบบที่ 3'
        WHEN vr.choice_number = 3 THEN 'แบบที่ 4'
        WHEN vr.choice_number = 4 THEN 'แบบที่ 5'
        WHEN vr.choice_number = 5 THEN 'แบบที่ 6'
        WHEN vr.choice_number = 6 THEN 'แบบที่ 7'
        WHEN vr.choice_number = 7 THEN 'ฉันไม่มีความเห็นใดๆ'
    END as choice_name,
    vr.vote_count,
    vr.last_updated
FROM public.vote_results vr
ORDER BY vr.choice_number;

-- =====================================================
-- สร้าง View สำหรับดูผู้ที่โหวตแล้ว
-- =====================================================

CREATE VIEW public.voted_users AS
SELECT 
    v.user_id,
    up.email,
    up.full_name,
    v.choice_1,
    v.choice_2,
    v.is_no_opinion,
    v.created_at
FROM public.votes v
JOIN public.user_profiles up ON v.user_id = up.id
ORDER BY v.created_at DESC; 