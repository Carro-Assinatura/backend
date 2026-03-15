import { useEffect, useState } from "react";
import { supabaseIsolated } from "@/lib/supabase";

interface TrackingConfig {
  type: string;
  credentials: Record<string, string>;
}

function injectScript(src: string, id: string) {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id;
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

function injectInline(code: string, id: string) {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id;
  s.textContent = code;
  document.head.appendChild(s);
}

function setupGTM(containerId: string) {
  if (!containerId) return;
  injectInline(
    `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});` +
    `var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';` +
    `j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);` +
    `})(window,document,'script','dataLayer','${containerId}');`,
    "tracking-gtm",
  );
}

function setupGA(measurementId: string) {
  if (!measurementId) return;
  injectScript(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`, "tracking-ga-lib");
  injectInline(
    `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}` +
    `gtag('js',new Date());gtag('config','${measurementId}');`,
    "tracking-ga-config",
  );
}

function setupClarity(projectId: string) {
  if (!projectId) return;
  injectInline(
    `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};` +
    `t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;` +
    `y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);` +
    `})(window,document,"clarity","script","${projectId}");`,
    "tracking-clarity",
  );
}

function setupMixpanel(token: string) {
  if (!token) return;
  injectInline(
    `(function(f,b){if(!b.__SV){var e,g,i,h;window.mixpanel=b;b._i=[];b.init=function(e,f,c){` +
    `function g(a,d){var b=d.split(".");2==b.length&&(a=a[b[0]],d=b[1]);a[d]=function(){` +
    `a.push([d].concat(Array.prototype.slice.call(arguments,0)))}}var a=b;"undefined"!==typeof c?a=b[c]=` +
    `[]:c="mixpanel";a.people=a.people||[];a.toString=function(a){var d="mixpanel";"mixpanel"!==c&&` +
    `(d+="."+c);a||(d+=" (stub)");return d};a.people.toString=function(){return a.toString(1)+".people (stub)"};` +
    `i="disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group ` +
    `remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking ` +
    `opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders ` +
    `people.set people.set_once people.unset people.increment people.append people.union people.track_charge ` +
    `people.clear_charges people.delete_user people.remove".split(" ");for(h=0;h<i.length;h++)g(a,i[h]);` +
    `var j="set set_once union unset remove delete".split(" ");a.get_group=function(){function b(c){d[c]=function(){` +
    `call2_args=arguments;call2=[c].concat(Array.prototype.slice.call(call2_args,0));a.push([e,call2])}}` +
    `for(var d={},e=["get_group"].concat(Array.prototype.slice.call(arguments,0)),c=0;c<j.length;c++)b(j[c]);` +
    `return d};b._i.push([e,f,c])};b.__SV=1.2;e=f.createElement("script");e.type="text/javascript";` +
    `e.async=!0;e.src="undefined"!==typeof MIXPANEL_CUSTOM_LIB_URL?MIXPANEL_CUSTOM_LIB_URL:` +
    `"file:"===f.location.protocol&&"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\\/\\//)` +
    `?"https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js":"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";` +
    `g=f.getElementsByTagName("script")[0];g.parentNode.insertBefore(e,g)}})(document,window.mixpanel||[]);` +
    `mixpanel.init("${token}",{track_pageview:"url-with-path"});`,
    "tracking-mixpanel",
  );
}

function setupHubSpot(portalId: string) {
  if (!portalId) return;
  injectScript(`https://js.hs-scripts.com/${portalId}.js`, "tracking-hubspot");
}

export default function TrackingScripts() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;

    supabaseIsolated
      .from("tracking_systems")
      .select("type, credentials, active")
      .eq("active", true)
      .then(({ data }) => {
        if (!data) return;

        for (const t of data as TrackingConfig[]) {
          const c = t.credentials ?? {};
          switch (t.type) {
            case "gtm":
              setupGTM(c.container_id);
              break;
            case "google_analytics":
              setupGA(c.measurement_id);
              break;
            case "clarity":
              setupClarity(c.project_id);
              break;
            case "mixpanel":
              setupMixpanel(c.project_token);
              break;
            case "hubspot":
              setupHubSpot(c.portal_id);
              break;
          }
        }

        setLoaded(true);
      });
  }, [loaded]);

  return null;
}
