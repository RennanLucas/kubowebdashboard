const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/javascript",
  "Cache-Control": "public, max-age=3600",
};

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const pid = url.searchParams.get("pid") || "";

  const supabaseProjectId = Deno.env.get("SUPABASE_URL")!
    .replace("https://", "")
    .replace(".supabase.co", "");

  const trackUrl = `https://${supabaseProjectId}.supabase.co/functions/v1/track`;

  const script = `(function(){
  var pid="${pid}";
  if(!pid)return;
  var u="${trackUrl}";
  var sid=sessionStorage.getItem("_kws")||Math.random().toString(36).substr(2,9);
  sessionStorage.setItem("_kws",sid);

  var q=[];
  try{var stored=localStorage.getItem("_kwq");if(stored)q=JSON.parse(stored);}catch(e){}
  if (!Array.isArray(q)) q = [];
  
  // Limite da fila offline: max 50 eventos para evitar estouro de Storage/Memória
  var MAX_Q = 50;
  var BATCH_SIZE = 10;
  var tid=null;

  function flush(isUnload){
    if(!q.length)return;
    var batch=q.slice(0, BATCH_SIZE); // Send max BATCH_SIZE at a time
    var remaining=q.slice(BATCH_SIZE);
    
    // Optimistically update queue
    q = remaining;
    try{
      if(q.length) localStorage.setItem("_kwq",JSON.stringify(q));
      else localStorage.removeItem("_kwq");
    }catch(e){}
    
    if(tid){clearTimeout(tid);tid=null;}

    var payload = JSON.stringify({events:batch});
    var ok = false;
    
    try {
      if (isUnload && navigator.sendBeacon) {
        // Enveloping in Blob to maintain application/json content-type for Edge func
        var blob = new Blob([payload], { type: 'application/json' });
        ok = navigator.sendBeacon(u, blob);
      } else if (window.fetch) {
        fetch(u, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: isUnload || false
        }).catch(function(){
          restoreQueue(batch);
        });
        ok = true; // Handled async
      } else {
        var x=new XMLHttpRequest();
        x.open("POST",u);
        x.setRequestHeader("Content-Type","application/json");
        x.send(payload);
        ok = true;
      }
    }catch(e){
      ok = false;
    }

    if (!ok && isUnload) {
      restoreQueue(batch);
    }
  }

  function restoreQueue(batch) {
    q=batch.concat(q).slice(0, MAX_Q); // Truncate to avoid overflow
    try{localStorage.setItem("_kwq",JSON.stringify(q));}catch(err){}
  }

  function send(d){
    q.push(d);
    if(q.length > MAX_Q) {
      q = q.slice(q.length - MAX_Q); // Keep newest MAX_Q items
    }
    try{localStorage.setItem("_kwq",JSON.stringify(q));}catch(e){}
    
    if(q.length>=BATCH_SIZE){
      flush(false);
    }else if(!tid){
      tid=setTimeout(function(){flush(false);},2000);
    }
  }

  function t(p){
    send({type:"pageview",pid:pid,path:p||location.pathname,ref:document.referrer,sid:sid});
  }

  function ev(evType,label,meta){
    send({type:"event",pid:pid,path:location.pathname,sid:sid,event_type:evType,event_label:label||"",metadata:meta||{}});
  }

  t();
  var pushState=history.pushState;
  history.pushState=function(){
    pushState.apply(history,arguments);
    t();
  };
  window.addEventListener("popstate",function(){t()});
  window.addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden")flush(true)});
  window.addEventListener("pagehide",function(){flush(true)});

  // Auto-detect clicks and forms (simplified for brevity)
  document.addEventListener("click",function(e){
    var el=e.target;
    while(el&&el!==document){
      if(el.tagName==="A"||el.tagName==="BUTTON"){
        var txt = el.textContent?.trim().substring(0,100)||"";
        ev("interaction", "click", { text: txt, tag: el.tagName });
        break;
      }
      el=el.parentElement;
    }
  },true);

  window._kw=function(evType,label,meta){ev(evType,label,meta)};
})();`;

  return new Response(script, { headers: corsHeaders });
});