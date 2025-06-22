"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestPage() {
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...');
  const [testResults, setTestResults] = useState<any>(null);
  const [errorDetails, setErrorDetails] = useState<string>('');

  const testConnection = async () => {
    try {
      setConnectionStatus('Testing connection...');
      setErrorDetails('');
      
      // Test 1: Simple auth test (doesn't require tables)
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        setConnectionStatus(`❌ Auth test failed: ${authError.message}`);
        setErrorDetails(JSON.stringify(authError, null, 2));
        console.error('Auth error:', authError);
        return;
      }
      
      console.log('Auth test successful:', authData);
      
      // Test 2: Try to access vote_results table
      const { data, error } = await supabase.from('vote_results').select('*');
      
      if (error) {
        if (error.message.includes('relation "vote_results" does not exist')) {
          setConnectionStatus('✅ Connected! (Table does not exist yet)');
          setTestResults({ 
            message: 'Connection successful, but vote_results table not found',
            instructions: 'Please create the vote_results table in Supabase Dashboard'
          });
        } else {
          setConnectionStatus(`❌ Table access failed: ${error.message}`);
          setErrorDetails(JSON.stringify(error, null, 2));
        }
      } else {
        setConnectionStatus('✅ Connected successfully!');
        setTestResults({
          message: 'Connection successful and table exists',
          data: data,
          count: data.length
        });
      }
      
    } catch (err: any) {
      setConnectionStatus(`❌ Error: ${err.message}`);
      setErrorDetails(JSON.stringify(err, null, 2));
      console.error('Test error:', err);
    }
  };

  useEffect(() => {
    console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    testConnection();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Environment Variables & Supabase Connection</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Environment Variables:</h2>
        <p><strong>SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
        <p><strong>SUPABASE_ANON_KEY:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'}</p>
      </div>

      <div className="mb-6">
        <button 
          onClick={testConnection}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Test Connection Again
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Connection Status:</h2>
        <p className="font-mono">{connectionStatus}</p>
      </div>

      {testResults && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Test Results:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}

      {errorDetails && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Error Details:</h2>
          <pre className="bg-red-100 p-4 rounded text-sm overflow-auto text-red-800">
            {errorDetails}
          </pre>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Next Steps:</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>1. ไปที่ Supabase Dashboard → Table Editor</li>
          <li>2. สร้างตาราง <code>vote_results</code></li>
          <li>3. เพิ่มข้อมูลทดสอบ</li>
          <li>4. กดปุ่ม "Test Connection Again"</li>
        </ul>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">CORS Settings (ถ้าจำเป็น):</h2>
        <p className="mb-2">ถ้าเจอปัญหา CORS ให้ลองหาใน Supabase Dashboard:</p>
        <ul className="list-disc list-inside space-y-1 mb-4">
          <li><strong>Settings → API</strong> → มองหา CORS Origins หรือ Allowed Origins</li>
          <li><strong>Settings → Auth</strong> → มองหา Site URL หรือ Redirect URLs</li>
          <li><strong>Settings → General</strong> → มองหา Site URL</li>
        </ul>
        <p className="mb-2 text-green-600">💡 <strong>คำแนะนำ:</strong> ลองสร้างตารางก่อน แล้วดูว่าการเชื่อมต่อทำงานหรือไม่</p>
        <p className="text-sm text-gray-600">Supabase เวอร์ชันใหม่อาจไม่ต้องการ CORS settings สำหรับ localhost</p>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">SQL for creating table:</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
{`CREATE TABLE vote_results (
  id SERIAL PRIMARY KEY,
  candidate_name VARCHAR(255) NOT NULL,
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO vote_results (candidate_name, votes) VALUES 
('Candidate A', 0),
('Candidate B', 0),
('Candidate C', 0);`}
        </pre>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Debug Info:</h2>
        <p>Check browser console for detailed logs</p>
      </div>
    </div>
  );
}
