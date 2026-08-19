import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://dwtsntjkysxlqluouhbr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3dHNudGpreXN4bHFsdW91aGJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4NjU4NTgsImV4cCI6MjEwMDQ0MTg1OH0.SPFdmR18c7CUNTXoUn-1pftYd9GY5hH65nEuZDJlCpg"
);

async function run() {
  const id = "c_178712345";
  const dbId = "00000000-0000-4000-a000-000000000001";

  console.log("Testing .or() with non-UUID id on clients table:");
  const res = await sb.from("clients").delete().or(`id.eq.${dbId},id.eq.${id}`).select();
  console.log("clients delete error:", res.error);

  console.log("Testing .or() on services table:");
  const sRes = await sb.from("services").delete().or(`id.eq.${dbId},id.eq.${id}`).select();
  console.log("services delete error:", sRes.error);

  console.log("Testing .or() on sub_services table:");
  const ssRes = await sb.from("sub_services").delete().or(`id.eq.${dbId},id.eq.${id}`).select();
  console.log("sub_services delete error:", ssRes.error);

  console.log("Testing .or() on banking_entries table:");
  const bRes = await sb.from("banking_entries").delete().or(`id.eq.${dbId},id.eq.${id}`).select();
  console.log("banking_entries delete error:", bRes.error);

  console.log("Testing .or() on invoices table:");
  const iRes = await sb.from("invoices").delete().or(`id.eq.${dbId},id.eq.${id}`).select();
  console.log("invoices delete error:", iRes.error);

  console.log("Testing .or() on assigned_services table with non-uuid client_id:");
  const aRes = await sb.from("assigned_services").delete().or(`client_id.eq.${dbId},client_id.eq.${id}`).select();
  console.log("assigned_services delete error:", aRes.error);
}

run().catch(console.error);
