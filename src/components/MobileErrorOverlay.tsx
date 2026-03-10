"use client";

import { useEffect, useState } from "react";

interface ErrorEntry {
  id: number;
  type: string;
  message: string;
  timestamp: string;
}

let errorId = 0;

export default function MobileErrorOverlay() {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    const addError = (type: string, message: string) => {
      setErrors((prev) => [
        ...prev,
        {
          id: ++errorId,
          type,
          message,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    };

    // Catch unhandled errors
    const onError = (e: ErrorEvent) => {
      addError("ERROR", `${e.message}\nat ${e.filename}:${e.lineno}:${e.colno}`);
    };

    // Catch unhandled promise rejections
    const onUnhandledRejection = (e: PromiseRejectionEvent) => {
      const msg =
        e.reason instanceof Error
          ? `${e.reason.message}\n${e.reason.stack}`
          : String(e.reason);
      addError("PROMISE", msg);
    };

    // Intercept console.error
    const origError = console.error;
    console.error = (...args: unknown[]) => {
      addError("console.error", args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" "));
      origError.apply(console, args);
    };

    // Intercept console.warn
    const origWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      addError("console.warn", args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" "));
      origWarn.apply(console, args);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      console.error = origError;
      console.warn = origWarn;
    };
  }, []);

  if (errors.length === 0) return null;

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        style={{
          position: "fixed",
          bottom: 10,
          right: 10,
          zIndex: 99999,
          background: "#dc2626",
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: 44,
          height: 44,
          fontSize: 18,
          fontWeight: "bold",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
          cursor: "pointer",
        }}
      >
        {errors.length}
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: "50vh",
        zIndex: 99999,
        background: "#1a1a1a",
        color: "#f0f0f0",
        fontFamily: "monospace",
        fontSize: 11,
        borderTop: "3px solid #dc2626",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "6px 10px",
          background: "#dc2626",
          color: "white",
          fontWeight: "bold",
          fontSize: 13,
        }}
      >
        <span>DEBUG: {errors.length} error(s)</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setErrors([])}
            style={{ background: "none", border: "none", color: "white", fontSize: 13, cursor: "pointer" }}
          >
            Clear
          </button>
          <button
            onClick={() => setMinimized(true)}
            style={{ background: "none", border: "none", color: "white", fontSize: 13, cursor: "pointer" }}
          >
            Min
          </button>
        </div>
      </div>
      <div style={{ overflow: "auto", padding: 8 }}>
        {errors.map((err) => (
          <div
            key={err.id}
            style={{
              marginBottom: 8,
              paddingBottom: 8,
              borderBottom: "1px solid #333",
            }}
          >
            <div style={{ color: err.type.includes("warn") ? "#facc15" : "#f87171", fontWeight: "bold" }}>
              [{err.timestamp}] {err.type}
            </div>
            <pre
              style={{
                margin: "4px 0 0",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                color: "#e5e5e5",
                userSelect: "all",
              }}
            >
              {err.message}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
