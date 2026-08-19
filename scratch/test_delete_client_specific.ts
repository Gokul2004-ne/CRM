import { supabase } from "../src/lib/supabase";
import { ensureUUID } from "../src/lib/utils";

async function run() {
  const targetId = "1795497a-c017-4716-8439-136000000000";
  const dbId = ensureUUID(targetId);
  
  console.log("Testing delete for ID:", targetId, "dbId:", dbId);
  const res = await supabase.from("clients").delete().or(`id.eq.${dbId},id.eq.${targetId}`).select();
  console.log("Delete result:", res.data, "error:", res.error);
}

run();
