import { syncClientToSupabase, fetchAllCRMData } from "../src/lib/supabaseData";
import { ensureUUID } from "../src/lib/utils";

async function testAddAndFetchClient() {
  console.log("Testing syncClientToSupabase...");
  const testClient = {
    id: `c_${Date.now()}`,
    name: "Gokul Nekkanti",
    ownerName: "Gokul Nekkanti",
    type: "PROPRIETORSHIP" as const,
    pan: "ABCDE1234F",
    gstin: "27ABCDE1234F1Z5",
    contactPerson: "Gokul",
    phone: "9876543210",
    mobile: "9876543210",
    email: "gokulnekkanti04@gmail.com",
    city: "Hyderabad",
    address: "Flat 101; Road 2; Telangana; 500001",
    addressLine1: "Flat 101",
    addressLine2: "Road 2",
    state: "Telangana",
    pincode: "500001",
    documentCount: 0,
    documents: [],
    portalCredentials: [],
    status: "ACTIVE",
    createdAt: new Date().toISOString().split("T")[0]
  };

  await syncClientToSupabase(testClient);
  console.log("syncClientToSupabase finished.");

  const allData = await fetchAllCRMData();
  console.log("fetchAllCRMData clients count:", allData?.clients.length);
  console.log("fetchAllCRMData clients:", JSON.stringify(allData?.clients, null, 2));
}

testAddAndFetchClient();
