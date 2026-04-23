import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://qdgjitmgoruiyajojjcr.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjNmOGIxOGMxLTVhNDEtNDBkMC05Nzg1LWQxMWE2MWY0NDMxOCJ9.eyJwcm9qZWN0SWQiOiJxZGdqaXRtZ29ydWl5YWpvampjciIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzY3OTQ2NDQ5LCJleHAiOjIwODMzMDY0NDksImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.u4kG9mUa6_EbNv_6JNVmSNNe9Kbv0inI7Lpwvalhb04';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };