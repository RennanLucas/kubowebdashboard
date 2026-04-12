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
  function t(p){
    var d={pid:pid,path:p||location.pathname,ref:document.referrer,sid:sid};
    if(navigator.sendBeacon){
      navigator.sendBeacon(u,JSON.stringify(d));
    }else{
      var x=new XMLHttpRequest();
      x.open("POST",u);
      x.setRequestHeader("Content-Type","application/json");
      x.send(JSON.stringify(d));
    }
  }
  t();
  var pushState=history.pushState;
  history.pushState=function(){
    pushState.apply(history,arguments);
    t();
  };
  window.addEventListener("popstate",function(){t()});
})();`;

  return new Response(script, { headers: corsHeaders });
});
