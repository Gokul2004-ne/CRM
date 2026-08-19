import { fetchAllCRMData } from "../src/lib/supabaseData";

async function testFetchAll() {
  const data = await fetchAllCRMData();
  console.log("Clients fetched from Supabase:", data?.clients?.length);
  console.log(data?.clients);
}

testFetchAll();
