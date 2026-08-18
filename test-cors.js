const url = "https://gitzmynfamubetgujtmm.supabase.co/functions/v1/get-dashboard-overview";

async function testOptions() {
  const res = await fetch(url, { method: "OPTIONS" });
  console.log("OPTIONS:", res.status);
}

async function testNoJwt() {
  const res = await fetch(url, { method: "POST" });
  console.log("No JWT:", res.status);
}

async function testInvalidJwt() {
  const res = await fetch(url, { method: "POST", headers: { Authorization: "Bearer invalid" } });
  console.log("Invalid JWT:", res.status);
}

async function run() {
  await testOptions();
  await testNoJwt();
  await testInvalidJwt();
}

run();
