@echo off
rem ==============================================================================
rem zpluscrm — Windows cURL API Execution Script
rem Project URL: https://dwtsntjkysxlqluouhbr.supabase.co
rem ==============================================================================

set SUPABASE_URL=https://dwtsntjkysxlqluouhbr.supabase.co
set SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3dHNudGpreXN4bHFsdW91aGJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4NjU4NTgsImV4cCI6MjEwMDQ0MTg1OH0.SPFdmR18c7CUNTXoUn-1pftYd9GY5hH65nEuZDJlCpg

echo ======================================================================
echo 🚀 1. CLIENTS TABLE (FETCH & INSERT)
echo ======================================================================

curl -s -X GET "%SUPABASE_URL%/rest/v1/clients?select=*" -H "apikey: %SUPABASE_KEY%" -H "Authorization: Bearer %SUPABASE_KEY%"

echo.
echo # Inserting Client via cURL...
curl -s -X POST "%SUPABASE_URL%/rest/v1/clients" -H "apikey: %SUPABASE_KEY%" -H "Authorization: Bearer %SUPABASE_KEY%" -H "Content-Type: application/json" -H "Prefer: return=representation" -d "{\"id\": \"c_curl_101\", \"name\": \"Apex Global Technologies\", \"type\": \"PRIVATE_LIMITED\", \"mobile\": \"9876543210\", \"email\": \"contact@apexglobal.com\", \"pan\": \"ABCDE1234F\", \"gstin\": \"27ABCDE1234F1Z5\", \"city\": \"Mumbai\", \"user_id\": \"usr_harsha_g_c\"}"

echo.
echo ======================================================================
echo 📦 2. SERVICES TABLE (FETCH)
echo ======================================================================
curl -s -X GET "%SUPABASE_URL%/rest/v1/services?select=*" -H "apikey: %SUPABASE_KEY%" -H "Authorization: Bearer %SUPABASE_KEY%"

echo.
echo ======================================================================
echo 📋 3. SUB_SERVICES TABLE (FETCH)
echo ======================================================================
curl -s -X GET "%SUPABASE_URL%/rest/v1/sub_services?select=*" -H "apikey: %SUPABASE_KEY%" -H "Authorization: Bearer %SUPABASE_KEY%"

echo.
echo ======================================================================
echo 🧾 4. INVOICES TABLE (FETCH & INSERT)
echo ======================================================================
curl -s -X GET "%SUPABASE_URL%/rest/v1/invoices?select=*" -H "apikey: %SUPABASE_KEY%" -H "Authorization: Bearer %SUPABASE_KEY%"

echo.
echo ======================================================================
echo 🏦 5. BANKING_ENTRIES TABLE (FETCH)
echo ======================================================================
curl -s -X GET "%SUPABASE_URL%/rest/v1/banking_entries?select=*" -H "apikey: %SUPABASE_KEY%" -H "Authorization: Bearer %SUPABASE_KEY%"

echo.
echo ======================================================================
echo 🎯 6. LEADS TABLE (FETCH & INSERT)
echo ======================================================================
curl -s -X GET "%SUPABASE_URL%/rest/v1/leads?select=*" -H "apikey: %SUPABASE_KEY%" -H "Authorization: Bearer %SUPABASE_KEY%"

echo.
echo ======================================================================
echo ⚙️ 7. USER_SETTINGS TABLE (FETCH)
echo ======================================================================
curl -s -X GET "%SUPABASE_URL%/rest/v1/user_settings?select=*" -H "apikey: %SUPABASE_KEY%" -H "Authorization: Bearer %SUPABASE_KEY%"

echo.
echo ======================================================================
echo 📧 8. OTP DISPATCH API (NEXT.JS SERVER ROUTE)
echo ======================================================================
curl -s -X POST "http://localhost:3000/api/send-otp" -H "Content-Type: application/json" -d "{\"email\": \"harsha@example.com\", \"code\": \"849201\", \"name\": \"Harsha\"}"

echo.
echo ======================================================================
echo ✅ cURL Batch Command Finished!
echo ======================================================================
