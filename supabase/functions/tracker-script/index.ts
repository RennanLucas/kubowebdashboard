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

  function send(d){
    if(navigator.sendBeacon){
      navigator.sendBeacon(u,JSON.stringify(d));
    }else{
      var x=new XMLHttpRequest();
      x.open("POST",u);
      x.setRequestHeader("Content-Type","application/json");
      x.send(JSON.stringify(d));
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

  // Auto-detect WhatsApp clicks
  document.addEventListener("click",function(e){
    var el=e.target;
    while(el&&el!==document){
      if(el.tagName==="A"){
        var href=el.href||"";
        if(href.indexOf("wa.me")>-1||href.indexOf("whatsapp")>-1||href.indexOf("api.whatsapp")>-1){
          ev("whatsapp_click",href,{text:el.textContent?.trim().substring(0,100)||""});
        }
        if(href.indexOf("tel:")===0){
          ev("phone_click",href,{text:el.textContent?.trim().substring(0,100)||""});
        }
        if(href.indexOf("mailto:")===0){
          ev("email_click",href,{text:el.textContent?.trim().substring(0,100)||""});
        }
      }
      // Detect button clicks (non-link buttons)
      if(el.tagName==="BUTTON"||(el.tagName==="INPUT"&&(el.type==="submit"||el.type==="button"))){
        ev("button_click",el.textContent?.trim().substring(0,100)||el.value||"button",{tag:el.tagName});
      }
      el=el.parentElement;
    }
  },true);

  // Auto-detect form submissions
  document.addEventListener("submit",function(e){
    var form=e.target;
    var action=form.action||location.href;
    var formId=form.id||form.name||"";
    ev("form_submit",formId,{action:action});
  },true);

  // Expose global for manual tracking
  window._kw=function(evType,label,meta){ev(evType,label,meta)};
})();`;

  return new Response(script, { headers: corsHeaders });
});