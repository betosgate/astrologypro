"use client";

import { useEffect } from "react";

/**
 * Admin API Docs — /admin/api-docs
 *
 * Renders Swagger UI via CDN, pointing at the OpenAPI spec served by /api/docs.
 * No npm package needed — loads swagger-ui-dist from unpkg at runtime.
 */
export default function ApiDocsPage() {
  useEffect(() => {
    // Dynamically inject Swagger UI CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/swagger-ui-dist/swagger-ui.css";
    document.head.appendChild(link);

    // Dynamically inject Swagger UI bundle script
    const script = document.createElement("script");
    script.src = "https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js";
    script.onload = () => {
      // @ts-expect-error — SwaggerUIBundle is injected globally by the CDN script
      const SwaggerUIBundle = window.SwaggerUIBundle;
      if (!SwaggerUIBundle) return;

      SwaggerUIBundle({
        url: "/api/docs",
        dom_id: "#swagger-ui",
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset,
        ],
        layout: "BaseLayout",
        deepLinking: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
        requestSnippetsEnabled: true,
        withCredentials: true, // send cookies with Try It Out requests
        persistAuthorization: true,
      });
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup on unmount
      document.head.removeChild(link);
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa" }}>
      <div
        style={{
          background: "#1a1a2e",
          color: "#fff",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <span style={{ fontSize: "20px", fontWeight: 700 }}>AstrologyPro</span>
        <span style={{ color: "#888", fontSize: "14px" }}>/ API Documentation</span>
      </div>
      <div id="swagger-ui" style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px" }} />
    </div>
  );
}
