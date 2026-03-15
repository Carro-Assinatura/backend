import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabaseIsolated } from "@/lib/supabase";

function getVisitorId(): string {
  const KEY = "multi_visitor_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

function getSessionId(): string {
  const KEY = "multi_session_id";
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

function getDeviceType(): string {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function getBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("OPR") || ua.includes("Opera")) return "Opera";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  return "Outro";
}

function getOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Win")) return "Windows";
  if (ua.includes("Mac")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  return "Outro";
}

function getUTM() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || "",
  };
}

export default function VisitorTracker() {
  const location = useLocation();
  const pageEnteredAt = useRef(Date.now());
  const prevPath = useRef("");

  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return;
    if (location.pathname === prevPath.current) return;

    const now = Date.now();
    const duration = prevPath.current ? Math.round((now - pageEnteredAt.current) / 1000) : 0;

    if (prevPath.current && duration > 0) {
      sendEvent("page_duration", prevPath.current, duration);
    }

    prevPath.current = location.pathname;
    pageEnteredAt.current = now;

    sendEvent("pageview", location.pathname + location.search, 0);
  }, [location]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const duration = Math.round((Date.now() - pageEnteredAt.current) / 1000);
      if (duration > 0 && prevPath.current) {
        sendEvent("page_exit", prevPath.current, duration);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  return null;
}

function sendEvent(eventType: string, pageUrl: string, durationSeconds: number) {
  const utm = getUTM();
  supabaseIsolated.from("client_tracking_events").insert({
    visitor_id: getVisitorId(),
    session_id: getSessionId(),
    event_type: eventType,
    page_url: pageUrl,
    page_title: document.title,
    referrer: document.referrer,
    utm_source: utm.utm_source,
    utm_medium: utm.utm_medium,
    utm_campaign: utm.utm_campaign,
    device: getDeviceType(),
    browser: getBrowser(),
    os: getOS(),
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
    duration_seconds: durationSeconds,
    metadata: {},
  }).then(() => {});
}
