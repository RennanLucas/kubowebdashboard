const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/javascript",
  "Cache-Control": "public, max-age=3600",
};

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const pid = url.searchParams.get("pid") || "";
  // consent=required ativa modo estrito: nada é coletado até window.kuboweb.consent(true)
  const consentRequired = url.searchParams.get("consent") === "required";

  const supabaseProjectId = Deno.env.get("SUPABASE_URL")!
    .replace("https://", "")
    .replace(".supabase.co", "");

  const trackUrl = `https://${supabaseProjectId}.supabase.co/functions/v1/track`;

  const script = `(function(){
  var pid="${pid}";
  if(!pid)return;

  // Bot / crawler detection — skip tracking for non-human agents
  var ua=navigator.userAgent||"";
  var botRe=/bot|crawler|spider|crawling|headless|prerender|phantom|slurp|googlebot|bingbot|yandex|baidu|duckduckbot|facebookexternalhit|linkedinbot|twitterbot/i;
  if(botRe.test(ua))return;

  var u="${trackUrl}";
  var CONSENT_REQUIRED=${consentRequired ? "true" : "false"};
  var CONSENT_KEY="_kwc";

  // ── Consent API (LGPD) ──────────────────────────────────────────────
  // getConsent(): "granted" | "denied" | null (sem decisão registrada)
  function getConsent(){
    try{return localStorage.getItem(CONSENT_KEY);}catch(e){return null;}
  }
  function setConsent(v){
    try{
      if(v===null)localStorage.removeItem(CONSENT_KEY);
      else localStorage.setItem(CONSENT_KEY,v);
    }catch(e){}
  }
  // Coleta é permitida se: modo estrito exige consentimento explícito "granted",
  // OU modo padrão (não estrito) permite a menos que o usuário tenha negado.
  function canCollect(){
    var c=getConsent();
    if(CONSENT_REQUIRED)return c==="granted";
    return c!=="denied";
  }
  function purgeLocalData(){
    try{
      localStorage.removeItem("_kwq");
      sessionStorage.removeItem("_kws");
    }catch(e){}
    q=[];
  }

  // Session ID (per browser tab)
  var sid=sessionStorage.getItem("_kws")||Math.random().toString(36).substr(2,9);
  sessionStorage.setItem("_kws",sid);

  // Offline queue
  var q=[];
  try{var stored=localStorage.getItem("_kwq");if(stored)q=JSON.parse(stored);}catch(e){}
  if(!Array.isArray(q))q=[];

  var MAX_Q=50,BATCH_SIZE=10,tid=null;

  // Generate unique event ID for deduplication
  function newId(){
    try{return crypto.randomUUID();}catch(e){
      return Math.random().toString(36).substr(2,9)+Date.now().toString(36);
    }
  }

  // Extract UTM params from URL
  function getUTMs(){
    var s=new URLSearchParams(location.search);
    var r={};
    ["utm_source","utm_medium","utm_campaign","utm_term","utm_content"].forEach(function(k){
      var v=s.get(k);if(v)r[k]=v;
    });
    return r;
  }

  function flush(isUnload){
    if(!q.length)return;
    var batch=q.slice(0,BATCH_SIZE);
    q=q.slice(BATCH_SIZE);
    try{
      if(q.length)localStorage.setItem("_kwq",JSON.stringify(q));
      else localStorage.removeItem("_kwq");
    }catch(e){}
    if(tid){clearTimeout(tid);tid=null;}
    var payload=JSON.stringify({events:batch});
    var ok=false;
    try{
      if(isUnload&&navigator.sendBeacon){
        var blob=new Blob([payload],{type:"application/json"});
        ok=navigator.sendBeacon(u,blob);
      }else if(window.fetch){
        fetch(u,{method:"POST",headers:{"Content-Type":"application/json"},body:payload,keepalive:isUnload||false}).catch(function(){restoreQueue(batch);});
        ok=true;
      }else{
        var x=new XMLHttpRequest();x.open("POST",u);x.setRequestHeader("Content-Type","application/json");x.send(payload);ok=true;
      }
    }catch(e){ok=false;}
    if(!ok&&isUnload)restoreQueue(batch);
  }

  function restoreQueue(batch){
    q=batch.concat(q).slice(0,MAX_Q);
    try{localStorage.setItem("_kwq",JSON.stringify(q));}catch(err){}
  }

  function send(d){
    if(!canCollect())return;
    d.event_id=d.event_id||newId();
    q.push(d);
    if(q.length>MAX_Q)q=q.slice(q.length-MAX_Q);
    try{localStorage.setItem("_kwq",JSON.stringify(q));}catch(e){}
    if(q.length>=BATCH_SIZE)flush(false);
    else if(!tid)tid=setTimeout(function(){flush(false);},2000);
  }

  function t(p){
    if(!canCollect())return;
    var utms=getUTMs();
    var ev={type:"pageview",pid:pid,path:p||location.pathname,ref:document.referrer,sid:sid};
    if(Object.keys(utms).length)ev.metadata=utms;
    send(ev);
  }

  function ev(evType,label,meta){
    if(!canCollect())return;
    send({type:"event",pid:pid,path:location.pathname,sid:sid,event_type:evType,event_label:label||"",metadata:meta||{}});
  }

  if(canCollect())t();
  var pushState=history.pushState;
  history.pushState=function(){pushState.apply(history,arguments);t();};
  window.addEventListener("popstate",function(){t();});
  window.addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden")flush(true);});
  window.addEventListener("pagehide",function(){flush(true);});

  // Auto-detect clicks — skip elements with data-kw-no-track
  document.addEventListener("click",function(e){
    var el=e.target;
    while(el&&el!==document){
      if(el.dataset&&el.dataset.kwNoTrack!==undefined)break;
      if(el.tagName==="A"||el.tagName==="BUTTON"){
        var txt=(el.textContent||"").trim().substring(0,100);
        ev("interaction","click",{text:txt,tag:el.tagName});
        break;
      }
      el=el.parentElement;
    }
  },true);

  // ── API pública ──────────────────────────────────────────────────────
  // window.kuboweb.consent(true)  → concede consentimento, inicia coleta
  // window.kuboweb.consent(false) → revoga consentimento, apaga dados locais
  // window.kuboweb.hasConsent()   → "granted" | "denied" | null
  window.kuboweb=window.kuboweb||{};
  window.kuboweb.consent=function(granted){
    if(granted){
      var wasBlocked=!canCollect();
      setConsent("granted");
      if(wasBlocked)t(); // dispara o pageview inicial agora que há consentimento
    }else{
      setConsent("denied");
      purgeLocalData();
    }
  };
  window.kuboweb.hasConsent=function(){return getConsent();};
  window._kw=function(evType,label,meta){ev(evType,label,meta);};
})();`;


  return new Response(script, { headers: corsHeaders });
});