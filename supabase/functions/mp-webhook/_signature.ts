// Matches the current official SDK: preserve data.id case in the manifest.
export async function verifyMpSignature(req:Request,dataId:string,secret:string) {
  const signature = req.headers.get("x-signature") ?? "";
  const requestId = req.headers.get("x-request-id") ?? "";
  if (!secret || !requestId || requestId.length>200 || !/^[a-z0-9_-]{1,128}$/i.test(dataId)) return false;
  const parts = signature.split(",").map(part => part.trim().split("="));
  const timestamps = parts.filter(([key]) => key==="ts");
  const signatures = parts.filter(([key]) => key==="v1");
  if (timestamps.length!==1 || signatures.length!==1) return false;
  const ts = timestamps[0][1] ?? ""; const v1 = signatures[0][1] ?? "";
  if (!/^(?:[0-9]{10}|[0-9]{13})$/.test(ts) || !/^[a-f0-9]{64}$/i.test(v1)) return false;
  const bytes = new Uint8Array(v1.match(/../g)!.map(byte => parseInt(byte,16)));
  try {
    const key = await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{ name:"HMAC",hash:"SHA-256" },false,["verify"]);
    return await crypto.subtle.verify("HMAC",key,bytes,new TextEncoder().encode(`id:${dataId};request-id:${requestId};ts:${ts};`));
  } catch { return false; }
}
