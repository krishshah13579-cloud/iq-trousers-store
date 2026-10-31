/**
 * Cloudflare Worker: IQ Trousers Scheduled Maintenance & Server-Down Edge Guard
 *
 * HOW IT WORKS:
 * 1. Automatically serves the branded Maintenance Page from Cloudflare Edge
 *    during scheduled hours (1:00 AM - 6:00 AM IST) even if your origin server is 100% OFF.
 * 2. Catches any unexpected origin server outages (502, 503, 504, 521 Web server down, 522 Connection timed out)
 *    and serves the branded Maintenance Page instead of Cloudflare technical error screens.
 * 3. Supports instant Admin bypass via ?bypass_maintenance=true or ?admin_preview=true.
 *
 * SETUP IN CLOUDFLARE (Takes 2 minutes):
 * 1. Log in to dash.cloudflare.com -> Select your account -> Workers & Pages -> Create Worker.
 * 2. Name it: "iq-maintenance-guard" -> Click Deploy.
 * 3. Click "Edit code" -> Replace all code with this file -> Click Deploy.
 * 4. Go to Workers & Pages -> iq-maintenance-guard -> Settings -> Triggers -> Add Route:
 *    - Route: *iqtrousers.in/*
 *    - Zone: iqtrousers.in
 */

const MAINTENANCE_HTML = "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"utf-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, maximum-scale=5.0\" />\n  <title>Scheduled Maintenance | IQ Trousers</title>\n  <meta name=\"description\" content=\"IQ Trousers is currently undergoing scheduled nightly maintenance from 1:00 AM to 6:00 AM IST. We will be back online shortly.\" />\n  <meta name=\"theme-color\" content=\"#09090b\" />\n  <link rel=\"icon\" href=\"/favicon.ico\" sizes=\"any\" />\n  <style>\n    *, *::before, *::after {\n      box-sizing: border-box;\n      margin: 0;\n      padding: 0;\n    }\n\n    body {\n      font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif;\n      background: radial-gradient(circle at 50% 15%, #18181b 0%, #09090b 100%);\n      color: #f4f4f5;\n      min-height: 100vh;\n      display: flex;\n      flex-direction: column;\n      justify-content: space-between;\n      align-items: center;\n      padding: 24px 16px;\n      line-height: 1.5;\n      -webkit-font-smoothing: antialiased;\n    }\n\n    .container {\n      width: 100%;\n      max-width: 680px;\n      margin: auto;\n      text-align: center;\n      padding: 36px 20px;\n    }\n\n    /* Brand Logo */\n    .brand-logo {\n      display: inline-flex;\n      align-items: center;\n      gap: 12px;\n      margin-bottom: 28px;\n      text-decoration: none;\n    }\n\n    .brand-logo img {\n      width: 44px;\n      height: 44px;\n      object-fit: contain;\n      filter: drop-shadow(0 4px 12px rgba(255,255,255,0.08));\n    }\n\n    .brand-name {\n      font-size: 22px;\n      font-weight: 800;\n      letter-spacing: 2.5px;\n      text-transform: uppercase;\n      color: #ffffff;\n    }\n\n    /* Glassmorphism Card */\n    .card {\n      background: rgba(24, 24, 27, 0.7);\n      backdrop-filter: blur(20px);\n      -webkit-backdrop-filter: blur(20px);\n      border: 1px solid rgba(255, 255, 255, 0.08);\n      border-radius: 24px;\n      padding: 40px 28px;\n      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.04);\n      margin-bottom: 24px;\n      position: relative;\n      overflow: hidden;\n    }\n\n    .card::before {\n      content: \"\";\n      position: absolute;\n      top: 0;\n      left: 10%;\n      right: 10%;\n      height: 1px;\n      background: linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.6), transparent);\n    }\n\n    /* Status Pill */\n    .status-pill {\n      display: inline-flex;\n      align-items: center;\n      gap: 8px;\n      padding: 6px 14px;\n      border-radius: 9999px;\n      background: rgba(245, 158, 11, 0.12);\n      border: 1px solid rgba(245, 158, 11, 0.3);\n      color: #fde68a;\n      font-size: 11px;\n      font-weight: 700;\n      text-transform: uppercase;\n      letter-spacing: 1px;\n      margin-bottom: 22px;\n    }\n\n    .pulse-dot {\n      width: 8px;\n      height: 8px;\n      border-radius: 50%;\n      background-color: #f59e0b;\n      position: relative;\n    }\n\n    .pulse-dot::after {\n      content: \"\";\n      position: absolute;\n      inset: -3px;\n      border-radius: 50%;\n      background-color: #f59e0b;\n      opacity: 0.75;\n      animation: pulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;\n    }\n\n    @keyframes pulse {\n      0%, 100% { transform: scale(1); opacity: 0.75; }\n      50% { transform: scale(2.2); opacity: 0; }\n    }\n\n    h1 {\n      font-size: 28px;\n      font-weight: 800;\n      letter-spacing: -0.5px;\n      color: #ffffff;\n      margin-bottom: 12px;\n    }\n\n    @media (min-width: 640px) {\n      h1 { font-size: 34px; }\n    }\n\n    .subtitle {\n      color: #a1a1aa;\n      font-size: 14.5px;\n      line-height: 1.6;\n      max-width: 520px;\n      margin: 0 auto 28px;\n    }\n\n    /* Countdown Grid */\n    .countdown-container {\n      margin: 28px 0;\n    }\n\n    .countdown-label {\n      font-size: 11px;\n      text-transform: uppercase;\n      letter-spacing: 1.5px;\n      color: #71717a;\n      margin-bottom: 12px;\n      font-weight: 600;\n    }\n\n    .countdown-grid {\n      display: grid;\n      grid-template-columns: repeat(3, minmax(70px, 1fr));\n      gap: 12px;\n      max-width: 340px;\n      margin: 0 auto;\n    }\n\n    .countdown-box {\n      background: rgba(39, 39, 42, 0.6);\n      border: 1px solid rgba(255, 255, 255, 0.06);\n      border-radius: 16px;\n      padding: 14px 10px;\n      text-align: center;\n    }\n\n    .countdown-num {\n      font-size: 26px;\n      font-weight: 800;\n      color: #f4f4f5;\n      font-feature-settings: \"tnum\";\n      font-variant-numeric: tabular-nums;\n    }\n\n    .countdown-unit {\n      font-size: 10px;\n      text-transform: uppercase;\n      letter-spacing: 1px;\n      color: #a1a1aa;\n      margin-top: 2px;\n    }\n\n    /* Schedule & Highlights */\n    .info-grid {\n      display: grid;\n      grid-template-columns: 1fr;\n      gap: 12px;\n      text-align: left;\n      margin-top: 28px;\n    }\n\n    @media (min-width: 540px) {\n      .info-grid {\n        grid-template-columns: repeat(2, 1fr);\n      }\n    }\n\n    .info-card {\n      background: rgba(39, 39, 42, 0.45);\n      border: 1px solid rgba(255, 255, 255, 0.05);\n      border-radius: 14px;\n      padding: 14px 16px;\n      display: flex;\n      align-items: flex-start;\n      gap: 12px;\n    }\n\n    .info-icon {\n      width: 22px;\n      height: 22px;\n      color: #fbbf24;\n      flex-shrink: 0;\n      margin-top: 2px;\n    }\n\n    .info-title {\n      font-size: 12px;\n      font-weight: 700;\n      color: #ffffff;\n      text-transform: uppercase;\n      letter-spacing: 0.5px;\n    }\n\n    .info-desc {\n      font-size: 12px;\n      color: #a1a1aa;\n      margin-top: 2px;\n    }\n\n    /* Support Details */\n    .support-box {\n      margin-top: 24px;\n      padding: 14px 18px;\n      background: rgba(255, 255, 255, 0.02);\n      border: 1px dashed rgba(255, 255, 255, 0.1);\n      border-radius: 14px;\n      font-size: 12.5px;\n      color: #a1a1aa;\n      display: flex;\n      flex-wrap: wrap;\n      align-items: center;\n      justify-content: center;\n      gap: 8px 16px;\n    }\n\n    .support-link {\n      color: #fde68a;\n      text-decoration: none;\n      font-weight: 600;\n      transition: color 0.15s ease;\n    }\n\n    .support-link:hover {\n      color: #ffffff;\n      text-decoration: underline;\n    }\n\n    /* Auto-reload status */\n    .reloader-notice {\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      gap: 6px;\n      font-size: 11.5px;\n      color: #71717a;\n      margin-top: 18px;\n    }\n\n    .spin-icon {\n      animation: spin 3s linear infinite;\n    }\n\n    @keyframes spin {\n      100% { transform: rotate(360deg); }\n    }\n\n    footer {\n      font-size: 11px;\n      color: #52525b;\n      text-align: center;\n      padding-top: 16px;\n    }\n  </style>\n</head>\n<body>\n  <div></div>\n\n  <main class=\"container\">\n    <!-- Brand Header -->\n    <a href=\"/\" class=\"brand-logo\" aria-label=\"IQ Trousers\">\n      <img src=\"/iq-trousers-logo-transparent.png\" alt=\"IQ Trousers Logo\" onerror=\"this.style.display='none'\" />\n      <span class=\"brand-name\">IQ TROUSERS</span>\n    </a>\n\n    <!-- Main Card -->\n    <section class=\"card\">\n      <div class=\"status-pill\">\n        <span class=\"pulse-dot\"></span>\n        <span>Nightly Maintenance: 1:00 AM – 6:00 AM IST</span>\n      </div>\n\n      <h1>We'll Be Back Shortly!</h1>\n      <p class=\"subtitle\">\n        Our website is currently undergoing scheduled nightly maintenance, inventory synchronization, and performance optimization.\n      </p>\n\n      <!-- Live Countdown to 6:00 AM IST -->\n      <div class=\"countdown-container\">\n        <div class=\"countdown-label\">Estimated Service Resumption in</div>\n        <div class=\"countdown-grid\">\n          <div class=\"countdown-box\">\n            <div id=\"hours\" class=\"countdown-num\">--</div>\n            <div class=\"countdown-unit\">Hours</div>\n          </div>\n          <div class=\"countdown-box\">\n            <div id=\"minutes\" class=\"countdown-num\">--</div>\n            <div class=\"countdown-unit\">Minutes</div>\n          </div>\n          <div class=\"countdown-box\">\n            <div id=\"seconds\" class=\"countdown-num\">--</div>\n            <div class=\"countdown-unit\">Seconds</div>\n          </div>\n        </div>\n      </div>\n\n      <!-- Schedule Info Cards -->\n      <div class=\"info-grid\">\n        <div class=\"info-card\">\n          <svg class=\"info-icon\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\" stroke-width=\"2\">\n            <circle cx=\"12\" cy=\"12\" r=\"10\"></circle>\n            <polyline points=\"12 6 12 12 16 14\"></polyline>\n          </svg>\n          <div>\n            <div class=\"info-title\">Maintenance Window</div>\n            <div class=\"info-desc\">1:00 AM to 6:00 AM IST Daily</div>\n          </div>\n        </div>\n\n        <div class=\"info-card\">\n          <svg class=\"info-icon\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\" stroke-width=\"2\">\n            <path d=\"M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4\"></path>\n          </svg>\n          <div>\n            <div class=\"info-title\">Existing Orders</div>\n            <div class=\"info-desc\">All placed orders are safely recorded</div>\n          </div>\n        </div>\n      </div>\n\n      <!-- Support Details -->\n      <div class=\"support-box\">\n        <span>Need urgent assistance?</span>\n        <a href=\"mailto:iqtrousers@gmail.com\" class=\"support-link\">iqtrousers@gmail.com</a>\n        <span>•</span>\n        <a href=\"tel:+919999999999\" class=\"support-link\">Call Store Care</a>\n      </div>\n\n      <!-- Auto reload notice -->\n      <div class=\"reloader-notice\">\n        <svg class=\"spin-icon\" width=\"13\" height=\"13\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">\n          <path d=\"M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67\"></path>\n        </svg>\n        <span>This page will automatically refresh as soon as service resumes.</span>\n      </div>\n    </section>\n  </main>\n\n  <footer>\n    &copy; <span id=\"year\">2026</span> IQ Trousers &bull; Krish Clothing Co., Ahmedabad, Gujarat &bull; All Rights Reserved.\n  </footer>\n\n  <script>\n    document.getElementById(\"year\").textContent = new Date().getFullYear();\n\n    // Calculate time remaining until 6:00 AM IST (Indian Standard Time, UTC +5:30)\n    function updateCountdown() {\n      var now = new Date();\n      // UTC time in ms\n      var utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);\n      // IST is UTC + 5:30 (330 minutes)\n      var istNow = new Date(utcMs + (330 * 60000));\n\n      var target = new Date(istNow);\n      target.setHours(6, 0, 0, 0);\n\n      // If current IST time is already past 6:00 AM, set target to 6:00 AM next day\n      if (istNow.getTime() >= target.getTime()) {\n        target.setDate(target.getDate() + 1);\n      }\n\n      var diffMs = target.getTime() - istNow.getTime();\n      if (diffMs <= 0) {\n        document.getElementById(\"hours\").textContent = \"00\";\n        document.getElementById(\"minutes\").textContent = \"00\";\n        document.getElementById(\"seconds\").textContent = \"00\";\n        // Reload storefront\n        setTimeout(function() { window.location.href = \"/\"; }, 2000);\n        return;\n      }\n\n      var totalSecs = Math.floor(diffMs / 1000);\n      var hrs = Math.floor(totalSecs / 3600);\n      var mins = Math.floor((totalSecs % 3600) / 60);\n      var secs = totalSecs % 60;\n\n      document.getElementById(\"hours\").textContent = String(hrs).padStart(2, \"0\");\n      document.getElementById(\"minutes\").textContent = String(mins).padStart(2, \"0\");\n      document.getElementById(\"seconds\").textContent = String(secs).padStart(2, \"0\");\n    }\n\n    updateCountdown();\n    setInterval(updateCountdown, 1000);\n\n    // Auto health check: Pings the server periodically.\n    // If the server comes back online before 6:00 AM, automatically redirects back to store.\n    function checkServerHealth() {\n      fetch(\"/api/health\", { cache: \"no-store\" })\n        .then(function(res) {\n          if (res.ok) {\n            // Check if outside maintenance window\n            var now = new Date();\n            var utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);\n            var istNow = new Date(utcMs + (330 * 60000));\n            var istHours = istNow.getHours();\n            if (istHours >= 6 || istHours < 1) {\n              window.location.href = \"/\";\n            }\n          }\n        })\n        .catch(function() {\n          // Server still off, continue waiting\n        });\n    }\n\n    setInterval(checkServerHealth, 30000);\n  </script>\n</body>\n</html>\n";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Calculate Indian Standard Time (IST, UTC+5:30)
    const now = new Date();
    const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const istMinutes = (utcMinutes + 330) % 1440;
    const istHour = Math.floor(istMinutes / 60);

    // Active maintenance window: 1:00 AM to 6:00 AM IST
    const isMaintenanceWindow = istHour >= 1 && istHour < 6;

    // Check for admin bypass
    const hasBypassParam = url.searchParams.get("bypass_maintenance") === "true" ||
                           url.searchParams.get("admin_preview") === "true";
    const cookieHeader = request.headers.get("Cookie") || "";
    const hasBypassCookie = cookieHeader.includes("maintenance_bypass=true");
    const isBypassed = hasBypassParam || hasBypassCookie;

    // Direct /maintenance or /maintenance.html request
    if (url.pathname === "/maintenance" || url.pathname === "/maintenance.html") {
      return new Response(MAINTENANCE_HTML, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=60",
        },
      });
    }

    // 1. Scheduled Window Enforcement (1:00 AM - 6:00 AM IST)
    // Directly serves from edge without needing origin server
    if (isMaintenanceWindow && !isBypassed && !url.pathname.startsWith("/api/health") && !url.pathname.startsWith("/admin")) {
      return new Response(MAINTENANCE_HTML, {
        status: 503,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Retry-After": "21600",
        },
      });
    }

    // 2. Normal Request: Forward to Origin Server
    try {
      const response = await fetch(request);

      // If origin returns an error (server down, bad gateway, gateway timeout)
      const errorStatuses = [502, 503, 504, 520, 521, 522, 523, 524];
      if (errorStatuses.includes(response.status) && !isBypassed && !url.pathname.startsWith("/api/health")) {
        return new Response(MAINTENANCE_HTML, {
          status: 503,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        });
      }

      // If user passed bypass query param, append cookie header to response
      if (hasBypassParam && !hasBypassCookie) {
        const newResponse = new Response(response.body, response);
        newResponse.headers.append("Set-Cookie", "maintenance_bypass=true; Path=/; Max-Age=86400; HttpOnly; SameSite=Lax");
        return newResponse;
      }

      return response;
    } catch (err) {
      // Origin server completely unreachable / connection refused
      return new Response(MAINTENANCE_HTML, {
        status: 503,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }
  },
};
