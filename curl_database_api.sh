#!/usr/bin/env bash
# ==============================================================================
# zpluscrm — Supabase Database REST API cURL Suite
# Project URL: https://dwtsntjkysxlqluouhbr.supabase.co
# ==============================================================================

SUPABASE_URL="https://dwtsntjkysxlqluouhbr.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3dHNudGpreXN4bHFsdW91aGJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4NjU4NTgsImV4cCI6MjEwMDQ0MTg1OH0.SPFdmR18c7CUNTXoUn-1pftYd9GY5hH65nEuZDJlCpg"

echo "======================================================================"
echo "🚀 1. CLIENTS TABLE (FETCH & INSERT)"
echo "======================================================================"

# Fetch all clients
curl -s -X GET "${SUPABASE_URL}/rest/v1/clients?select=*" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"

echo -e "\n\n# Insert New Client"
curl -s -X POST "${SUPABASE_URL}/rest/v1/clients" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "id": "c_curl_101",
    "name": "Apex Global Technologies",
    "type": "PRIVATE_LIMITED",
    "mobile": "9876543210",
    "email": "contact@apexglobal.com",
    "pan": "ABCDE1234F",
    "gstin": "27ABCDE1234F1Z5",
    "city": "Mumbai",
    "user_id": "usr_harsha_g_c"
  }'

echo -e "\n\n======================================================================"
echo "📦 2. SERVICES TABLE (FETCH)"
echo "======================================================================"
curl -s -X GET "${SUPABASE_URL}/rest/v1/services?select=*" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"

echo -e "\n\n======================================================================"
echo "📋 3. SUB_SERVICES TABLE (FETCH)"
echo "======================================================================"
curl -s -X GET "${SUPABASE_URL}/rest/v1/sub_services?select=*" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"

echo -e "\n\n======================================================================"
echo "📄 4. REQUIRED_DOCS TABLE (FETCH)"
echo "======================================================================"
curl -s -X GET "${SUPABASE_URL}/rest/v1/required_docs?select=*" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"

echo -e "\n\n======================================================================"
echo "📌 5. ASSIGNED_SERVICES TABLE (FETCH)"
echo "======================================================================"
curl -s -X GET "${SUPABASE_URL}/rest/v1/assigned_services?select=*" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"

echo -e "\n\n======================================================================"
echo "🧾 6. INVOICES TABLE (FETCH & INSERT)"
echo "======================================================================"
curl -s -X GET "${SUPABASE_URL}/rest/v1/invoices?select=*" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"

echo -e "\n\n# Insert New Tax Invoice"
curl -s -X POST "${SUPABASE_URL}/rest/v1/invoices" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "id": "inv_curl_201",
    "type": "INVOICE",
    "invoice_number": "INV/2026-9901",
    "date": "2026-08-14",
    "financial_year": "2026-27",
    "client_id": "c_curl_101",
    "client_name": "Apex Global Technologies",
    "subtotal": 15000,
    "gst_rate": 18,
    "gst_amount": 2700,
    "total": 17700,
    "amount_received": 10000,
    "balance_due": 7700,
    "status": "SENT",
    "user_id": "usr_harsha_g_c"
  }'

echo -e "\n\n======================================================================"
echo "🏦 7. BANKING_ENTRIES TABLE (FETCH)"
echo "======================================================================"
curl -s -X GET "${SUPABASE_URL}/rest/v1/banking_entries?select=*" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"

echo -e "\n\n======================================================================"
echo "🎯 8. LEADS TABLE (FETCH & INSERT)"
echo "======================================================================"
curl -s -X GET "${SUPABASE_URL}/rest/v1/leads?select=*" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"

echo -e "\n\n# Insert Sales Lead"
curl -s -X POST "${SUPABASE_URL}/rest/v1/leads" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "id": "lead_curl_301",
    "name": "Starlight Digital Solutions",
    "mobile": "9811223344",
    "source": "WhatsApp Business",
    "status": "LEAD",
    "notes": "Inquired for Private Limited GST Registration",
    "user_id": "usr_harsha_g_c"
  }'

echo -e "\n\n======================================================================"
echo "🔄 9. RENEWALS TABLE (FETCH)"
echo "======================================================================"
curl -s -X GET "${SUPABASE_URL}/rest/v1/renewals?select=*" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"

echo -e "\n\n======================================================================"
echo "⚡ 10. ONE_TIME_SERVICES TABLE (FETCH)"
echo "======================================================================"
curl -s -X GET "${SUPABASE_URL}/rest/v1/one_time_services?select=*" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"

echo -e "\n\n======================================================================"
echo "📝 11. DRAFTS TABLE (FETCH)"
echo "======================================================================"
curl -s -X GET "${SUPABASE_URL}/rest/v1/drafts?select=*" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"

echo -e "\n\n======================================================================"
echo "🤝 12. COLLABORATIONS TABLE (FETCH)"
echo "======================================================================"
curl -s -X GET "${SUPABASE_URL}/rest/v1/collaborations?select=*" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"

echo -e "\n\n======================================================================"
echo "⚙️ 13. USER_SETTINGS TABLE (FETCH)"
echo "======================================================================"
curl -s -X GET "${SUPABASE_URL}/rest/v1/user_settings?select=*" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"

echo -e "\n\n======================================================================"
echo "📧 14. OTP DISPATCH API (NEXT.JS SERVER ROUTE)"
echo "======================================================================"
curl -s -X POST "http://localhost:3000/api/send-otp" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "harsha@example.com",
    "code": "849201",
    "name": "Harsha"
  }'

echo -e "\n\n======================================================================"
echo "✅ cURL API Execution Suite Completed!"
echo "======================================================================"
