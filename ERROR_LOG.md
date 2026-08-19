# Comprehensive Error Log & Root-Cause Diagnostic Report

**Project:** CRM Expert / Zplus CRM  
**Date:** 2026-08-20  
**Status:** Diagnostic & Failure Mode Analysis  

---

## 1. Executive Summary

Despite database-level tests passing in Node.js, the frontend user interface (UI) and the Supabase cloud database fail to synchronize reliably during live browser usage. Specifically:
1. **Insert Actions:** Records created in the UI appear in the browser session in memory, but either fail to persist to Supabase or are stored with mismatched `user_id` scopes.
2. **Delete Actions:** Clicking delete updates the local in-memory store, but does not execute a successful SQL `DELETE` in the remote database or fails due to ID/authorization mismatches.
3. **Data Loss / Reappearance on Refresh:** On hard refresh (`F5`), records either disappear (if the insert never reached the cloud) or reappeared (if the delete never reached the cloud).

---

## 2. Root Cause Analysis (Failure Modes)

### Issue A: Dual Auth System & `user_id` Identity Fragmentation
* **Mechanism:** The application does not use native Supabase Auth cookies/sessions. Instead, it uses custom client-side storage (`zpluscrm_active_session`).
* **Consequence:** 
  * When `getUserId()` executes in the browser, `supabase.auth.getUser()` fails with `AuthSessionMissingError` (taking ~300ms network round-trip).
  * If localStorage is cleared or not yet read, `getUserId()` falls back to `"usr_default_account"`.
  * **Result:** A client inserted under `"usr_default_account"` is completely invisible when the user logs in as `"usr_gowthammummidi999_gmail_com"`, creating the illusion that data was never saved to the database.

```
[Browser UI] -> Insert Client (user_id: usr_default_account)
[Page Refresh] -> Fetch Clients (user_id: usr_gowthammummidi999_gmail_com)
[Supabase Query] -> SELECT * WHERE user_id = 'usr_gowthammummidi999_gmail_com' -> Returns []
[UI Outcome] -> "Entered data disappeared on refresh!"
```

---

### Issue B: ID Format Asymmetry (`c_timestamp` vs `UUID`)
* **Mechanism:** The frontend form handler in `src/app/clients/page.tsx` generates client IDs using timestamps:
  ```ts
  id: `c_${Date.now()}` // e.g. "c_1787165518211"
  ```
* **PostgreSQL Column Type:** The `id` column in Supabase `clients` table is of type `UUID`.
* **Consequence:**
  * `syncClientToSupabase` converts `c_1787165518211` to `60426bb0-c00e-4001-8871-655182110000` before saving.
  * If the store retains the raw `c_1787165518211` string, subsequent updates or deletes that query `WHERE id = raw_id` match 0 rows in PostgreSQL.

---

### Issue C: Browser-Side Supabase SDK vs Next.js Server API Routes
* **Mechanism:** The frontend currently makes direct HTTP calls to Supabase via `@supabase/supabase-js` from client components rather than routing requests through Next.js server API endpoints (`/api/clients`, `/api/services`).
* **Consequence:**
  * Browser network restrictions, ad-blockers, or expired local tokens cause the Supabase client SDK to fail silently in the browser.
  * Errors caught in `try/catch` blocks only logged warnings to `console.error` without alerting the UI or blocking state changes.

---

### Issue D: Realtime Subscription Race Condition
* **Mechanism:** `AppShell.tsx` has a Supabase Realtime listener on `postgres_changes` across all public tables.
* **Consequence:**
  * When a delete operation was triggered, the first child table deletion emitted a Postgres change event.
  * The listener immediately fired `loadSupabaseData()`, fetching the still-existing parent record from the database before the main delete SQL statement completed, re-injecting the deleted item into the UI.

---

## 3. Systematic Verification & Status of Components

| Component / Action | Backend (Supabase Cloud) | Next.js API Routes | Frontend UI Event Handlers | Synchronization Status |
| :--- | :--- | :--- | :--- | :--- |
| **Clients Insert** | ✅ Table exists, RLS open | ✅ `/api/clients` POST works | ⚠️ Direct SDK call in store | ⚠️ Fails if `userId` shifts |
| **Clients Delete** | ✅ SQL `DELETE` works | ✅ `/api/clients` DELETE works | ⚠️ `deleteClient()` in store | ⚠️ ID / Scoping mismatch |
| **Services / Packages** | ✅ Table exists | ✅ `/api/services` works | ⚠️ Unseeded for new users | ❌ Empty on new user login |
| **Banking Entries** | ✅ Table exists | ⚠️ Direct SDK | ⚠️ Depends on assigned services | ⚠️ Linked cascade dependency |
| **Invoices & Drafts** | ✅ Table exists | ⚠️ Direct SDK | ⚠️ Direct SDK | ⚠️ Auth header dependent |

---

## 4. Required Permanent Fixes

1. **Centralize All Mutations Through Next.js API Routes:**
   * Transition `syncClientToSupabase` and `removeClientFromSupabase` to call standard HTTP `fetch('/api/clients')` instead of relying on the client-side Supabase JS SDK.
   * This guarantees consistent service-role or verified user headers on every request.

2. **Normalize IDs to UUID at Creation Time:**
   * Ensure `crypto.randomUUID()` generates standard UUIDv4 strings directly in the form handlers (`src/app/clients/page.tsx`, `src/app/services/page.tsx`), preventing any ID divergence between UI state and database rows.

3. **Synchronous Single-Source User Identification:**
   * Eliminate asynchronous `supabase.auth.getUser()` network hops inside `getUserId()`. Use the verified active session user ID synchronously so every read and write uses the exact same `user_id`.

4. **Seed Default Packages/Services Per User:**
   * When a user logs in for the first time, automatically provision default practice services (GST, Income Tax, ROC, Audit) so all dropdowns and association tables function properly.
