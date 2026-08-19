import { supabase } from "../src/lib/supabase";

async function checkClientsInCloud() {
  const { data, error } = await supabase.from("clients").select("*");
  if (error) {
    console.error("Error fetching clients:", error);
  } else {
    console.log("Total clients in Supabase:", data?.length);
    console.log("Clients in Supabase:", JSON.stringify(data, null, 2));
  }
}

checkClientsInCloud();
