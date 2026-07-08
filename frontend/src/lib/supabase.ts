import { createClient } from '@supabase/supabase-js';

// Falls back to the shared dev project when VITE_ vars aren't set, so
// `npm run dev` keeps working with zero setup; start.sh/start.ps1 and
// docker-compose.yml plumb VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY through
// for anyone who needs to point at a different project.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qdgjitmgoruiyajojjcr.databasepad.com';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjNmOGIxOGMxLTVhNDEtNDBkMC05Nzg1LWQxMWE2MWY0NDMxOCJ9.eyJwcm9qZWN0SWQiOiJxZGdqaXRtZ29ydWl5YWpvampjciIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzY3OTQ2NDQ5LCJleHAiOjIwODMzMDY0NDksImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.u4kG9mUa6_EbNv_6JNVmSNNe9Kbv0inI7Lpwvalhb04';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };