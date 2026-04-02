"use client";

import React from "react";

// ─── 1. DashboardMockup ────────────────────────────────────────────────────────
export function DashboardMockup({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 560 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Dashboard mockup illustration"
    >
      {/* Background */}
      <rect width="560" height="380" rx="12" fill="#18181b" />
      <rect x="0.5" y="0.5" width="559" height="379" rx="11.5" stroke="#27272a" />

      {/* Sidebar */}
      <rect x="0" y="0" width="120" height="380" rx="12" fill="#0f0f12" />
      <rect x="0" y="0" width="120" height="380" rx="12" stroke="#27272a" strokeWidth="0.5" />
      {/* Logo area */}
      <circle cx="36" cy="28" r="10" fill="#8b5cf6" opacity="0.3" />
      <circle cx="36" cy="28" r="5" fill="#8b5cf6" />
      <rect x="52" y="22" width="50" height="6" rx="3" fill="#a1a1aa" opacity="0.3" />
      <rect x="52" y="32" width="35" height="4" rx="2" fill="#a1a1aa" opacity="0.15" />
      {/* Nav items */}
      {[60, 84, 108, 132, 156].map((y, i) => (
        <g key={y}>
          <rect
            x="16"
            y={y}
            width="88"
            height="18"
            rx="6"
            fill={i === 0 ? "#8b5cf6" : "transparent"}
            opacity={i === 0 ? 0.15 : 1}
          />
          <rect x="24" y={y + 5} width="8" height="8" rx="2" fill={i === 0 ? "#8b5cf6" : "#52525b"} opacity={i === 0 ? 1 : 0.5} />
          <rect x="38" y={y + 6} width={40 + (i % 3) * 8} height="5" rx="2.5" fill={i === 0 ? "#8b5cf6" : "#52525b"} opacity={i === 0 ? 0.8 : 0.3} />
        </g>
      ))}
      {/* Sidebar bottom user */}
      <circle cx="36" cy="354" r="10" fill="#3f3f46" />
      <rect x="52" y="349" width="48" height="5" rx="2.5" fill="#52525b" opacity="0.4" />
      <rect x="52" y="358" width="32" height="4" rx="2" fill="#52525b" opacity="0.2" />

      {/* Main content area */}
      {/* Stat cards */}
      {[
        { x: 136, label: "Revenue", value: "$2,450", color: "#22c55e" },
        { x: 244, label: "Bookings", value: "18", color: "#8b5cf6" },
        { x: 352, label: "Clients", value: "12", color: "#6366f1" },
        { x: 460, label: "Rating", value: "4.9", color: "#f59e0b" },
      ].map((card) => (
        <g key={card.label}>
          <rect x={card.x} y="16" width="96" height="60" rx="8" fill="#1c1c22" stroke="#27272a" strokeWidth="0.5" />
          <text x={card.x + 12} y="34" fontSize="8" fill="#71717a" fontFamily="system-ui">{card.label}</text>
          <text x={card.x + 12} y="54" fontSize="16" fontWeight="bold" fill={card.color} fontFamily="system-ui">{card.value}</text>
          <text x={card.x + 12} y="66" fontSize="7" fill="#22c55e" fontFamily="system-ui">+18%</text>
        </g>
      ))}

      {/* Chart area */}
      <rect x="136" y="88" width="310" height="160" rx="8" fill="#1c1c22" stroke="#27272a" strokeWidth="0.5" />
      <text x="152" y="108" fontSize="9" fontWeight="600" fill="#a1a1aa" fontFamily="system-ui">Revenue This Month</text>
      {/* Bar chart */}
      {[
        { h: 55 }, { h: 72 }, { h: 48 }, { h: 90 }, { h: 65 }, { h: 82 },
        { h: 95 }, { h: 78 }, { h: 100 }, { h: 60 }, { h: 88 }, { h: 70 },
      ].map((bar, i) => (
        <g key={i}>
          <defs>
            <linearGradient id={`bar-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <rect
            x={156 + i * 24}
            y={232 - bar.h}
            width="16"
            height={bar.h}
            rx="3"
            fill={`url(#bar-grad-${i})`}
          />
        </g>
      ))}
      {/* Chart x-axis labels */}
      {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
        <text key={m} x={158 + i * 24} y="242" fontSize="6" fill="#52525b" fontFamily="system-ui">{m}</text>
      ))}

      {/* Right panel - upcoming bookings */}
      <rect x="458" y="88" width="90" height="160" rx="8" fill="#1c1c22" stroke="#27272a" strokeWidth="0.5" />
      <text x="468" y="106" fontSize="7" fontWeight="600" fill="#a1a1aa" fontFamily="system-ui">Upcoming</text>
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x="468" y={114 + i * 32} width="70" height="26" rx="5" fill="#27272a" opacity="0.5" />
          <circle cx="478" cy={124 + i * 32} r="4" fill={["#8b5cf6", "#22c55e", "#f59e0b", "#6366f1"][i]} opacity="0.6" />
          <rect x="486" y={120 + i * 32} width="40" height="4" rx="2" fill="#71717a" opacity="0.4" />
          <rect x="486" y={128 + i * 32} width="28" height="3" rx="1.5" fill="#52525b" opacity="0.3" />
        </g>
      ))}

      {/* Bottom row cards */}
      {[136, 290, 444].map((x, i) => (
        <g key={x}>
          <rect x={x} y="260" width={i < 2 ? 144 : 104} height="104" rx="8" fill="#1c1c22" stroke="#27272a" strokeWidth="0.5" />
          <rect x={x + 12} y="276" width={i < 2 ? 60 : 48} height="5" rx="2.5" fill="#71717a" opacity="0.3" />
          <rect x={x + 12} y="288" width={i < 2 ? 90 : 70} height="4" rx="2" fill="#52525b" opacity="0.2" />
          <rect x={x + 12} y="300" width={i < 2 ? 70 : 55} height="4" rx="2" fill="#52525b" opacity="0.15" />
        </g>
      ))}
    </svg>
  );
}

// ─── 2. VideoSessionMockup ─────────────────────────────────────────────────────
export function VideoSessionMockup({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 560 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Video session mockup illustration"
    >
      {/* Background */}
      <rect width="560" height="380" rx="12" fill="#18181b" />
      <rect x="0.5" y="0.5" width="559" height="379" rx="11.5" stroke="#27272a" />

      {/* Main video feed */}
      <rect x="12" y="12" width="380" height="310" rx="8" fill="#0c0c0e" />
      {/* Person silhouette in main feed */}
      <ellipse cx="202" cy="200" rx="50" ry="55" fill="#1c1c22" />
      <circle cx="202" cy="140" r="32" fill="#1c1c22" />
      {/* Subtle grid overlay */}
      {[80, 160, 240, 320].map((x) => (
        <line key={`v${x}`} x1={x} y1="12" x2={x} y2="322" stroke="#27272a" strokeWidth="0.3" opacity="0.3" />
      ))}
      {[80, 160, 240].map((y) => (
        <line key={`h${y}`} x1="12" y1={y} x2="392" y2={y} stroke="#27272a" strokeWidth="0.3" opacity="0.3" />
      ))}

      {/* REC indicator */}
      <rect x="24" y="24" width="52" height="20" rx="10" fill="#ef4444" opacity="0.2" />
      <circle cx="36" cy="34" r="4" fill="#ef4444" />
      <text x="44" y="38" fontSize="9" fontWeight="700" fill="#ef4444" fontFamily="system-ui">REC</text>

      {/* Timer badge */}
      <rect x="316" y="24" width="64" height="24" rx="12" fill="#8b5cf6" opacity="0.2" />
      <text x="326" y="40" fontSize="11" fontWeight="700" fill="#8b5cf6" fontFamily="monospace">23:45</text>

      {/* PiP video feed */}
      <rect x="280" y="220" width="100" height="80" rx="6" fill="#1a1a1f" stroke="#8b5cf6" strokeWidth="1" opacity="0.9" />
      {/* Person silhouette in PiP */}
      <ellipse cx="330" cy="275" rx="16" ry="18" fill="#27272a" />
      <circle cx="330" cy="252" r="11" fill="#27272a" />

      {/* Side panel */}
      <rect x="400" y="12" width="148" height="310" rx="8" fill="#1c1c22" stroke="#27272a" strokeWidth="0.5" />
      {/* Client info section */}
      <text x="414" y="36" fontSize="9" fontWeight="600" fill="#a1a1aa" fontFamily="system-ui">Client Info</text>
      <circle cx="424" cy="56" r="12" fill="#3f3f46" />
      <rect x="442" y="50" width="60" height="5" rx="2.5" fill="#71717a" opacity="0.4" />
      <rect x="442" y="60" width="42" height="4" rx="2" fill="#52525b" opacity="0.3" />
      <line x1="414" y1="78" x2="534" y2="78" stroke="#27272a" strokeWidth="0.5" />

      {/* Birth data */}
      <text x="414" y="94" fontSize="7" fill="#71717a" fontFamily="system-ui">Birth Data</text>
      {[100, 112, 124].map((y, i) => (
        <g key={y}>
          <rect x="414" y={y} width={["60", "48", "54"][i] as unknown as number} height="4" rx="2" fill="#52525b" opacity="0.3" />
        </g>
      ))}

      <line x1="414" y1="140" x2="534" y2="140" stroke="#27272a" strokeWidth="0.5" />

      {/* Notes section */}
      <text x="414" y="156" fontSize="9" fontWeight="600" fill="#a1a1aa" fontFamily="system-ui">Session Notes</text>
      {[166, 178, 190, 202, 214].map((y, i) => (
        <rect key={y} x="414" y={y} width={80 - i * 8} height="4" rx="2" fill="#52525b" opacity={0.25 - i * 0.03} />
      ))}

      {/* Chart preview */}
      <rect x="414" y="236" width="120" height="74" rx="6" fill="#0f0f12" stroke="#27272a" strokeWidth="0.5" />
      <circle cx="474" cy="273" r="28" stroke="#8b5cf6" strokeWidth="0.5" opacity="0.4" fill="none" />
      <circle cx="474" cy="273" r="20" stroke="#6366f1" strokeWidth="0.5" opacity="0.3" fill="none" />
      <circle cx="474" cy="273" r="12" stroke="#8b5cf6" strokeWidth="0.3" opacity="0.2" fill="none" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <line
          key={deg}
          x1={474 + Math.cos((deg * Math.PI) / 180) * 12}
          y1={273 + Math.sin((deg * Math.PI) / 180) * 12}
          x2={474 + Math.cos((deg * Math.PI) / 180) * 28}
          y2={273 + Math.sin((deg * Math.PI) / 180) * 28}
          stroke="#8b5cf6"
          strokeWidth="0.3"
          opacity="0.3"
        />
      ))}

      {/* Bottom control bar */}
      <rect x="12" y="330" width="536" height="38" rx="8" fill="#1c1c22" stroke="#27272a" strokeWidth="0.5" />
      {/* Control buttons */}
      {[
        { cx: 220, icon: "mic", fill: "#27272a" },
        { cx: 252, icon: "cam", fill: "#27272a" },
        { cx: 284, icon: "screen", fill: "#27272a" },
        { cx: 316, icon: "chat", fill: "#27272a" },
        { cx: 360, icon: "end", fill: "#ef4444" },
      ].map((btn) => (
        <g key={btn.icon}>
          <circle
            cx={btn.cx}
            cy="349"
            r={btn.icon === "end" ? 14 : 12}
            fill={btn.fill}
            opacity={btn.icon === "end" ? 0.2 : 0.6}
            stroke={btn.icon === "end" ? "#ef4444" : "#3f3f46"}
            strokeWidth="0.5"
          />
          {btn.icon === "end" ? (
            <rect x={btn.cx - 8} y="347" width="16" height="4" rx="2" fill="#ef4444" />
          ) : (
            <rect x={btn.cx - 4} y="345" width="8" height="8" rx="2" fill="#71717a" opacity="0.5" />
          )}
        </g>
      ))}
    </svg>
  );
}

// ─── 3. LandingPageMockup ──────────────────────────────────────────────────────
export function LandingPageMockup({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 560 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Landing page mockup illustration"
    >
      <rect width="560" height="420" rx="12" fill="#18181b" />
      <rect x="0.5" y="0.5" width="559" height="419" rx="11.5" stroke="#27272a" />

      {/* Browser chrome */}
      <rect x="0" y="0" width="560" height="28" rx="12" fill="#0f0f12" />
      <circle cx="18" cy="14" r="4" fill="#ef4444" opacity="0.6" />
      <circle cx="30" cy="14" r="4" fill="#f59e0b" opacity="0.6" />
      <circle cx="42" cy="14" r="4" fill="#22c55e" opacity="0.6" />
      <rect x="160" y="7" width="240" height="14" rx="7" fill="#27272a" />
      <text x="210" y="17" fontSize="7" fill="#71717a" fontFamily="system-ui">astrologypro.com/mystic-maya</text>

      {/* Hero section with gradient */}
      <defs>
        <linearGradient id="hero-grad" x1="0" y1="28" x2="560" y2="180">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect x="0" y="28" width="560" height="140" fill="url(#hero-grad)" />

      {/* Avatar */}
      <circle cx="280" cy="80" r="28" fill="#27272a" stroke="#8b5cf6" strokeWidth="2" />
      <circle cx="280" cy="72" r="10" fill="#52525b" />
      <ellipse cx="280" cy="92" rx="14" ry="10" fill="#52525b" />

      {/* Name and tagline */}
      <rect x="220" y="116" width="120" height="8" rx="4" fill="#e4e4e7" opacity="0.8" />
      <rect x="200" y="130" width="160" height="5" rx="2.5" fill="#71717a" opacity="0.4" />

      {/* Star rating */}
      {[0, 1, 2, 3, 4].map((i) => (
        <polygon
          key={i}
          points={`${252 + i * 14},148 ${254 + i * 14},153 ${249 + i * 14},155 ${253 + i * 14},158 ${251 + i * 14},163 ${256 + i * 14},160 ${261 + i * 14},163 ${259 + i * 14},158 ${263 + i * 14},155 ${258 + i * 14},153`}
          fill="#f59e0b"
          opacity="0.8"
        />
      ))}

      {/* Service cards grid */}
      {[
        { x: 20, y: 182 },
        { x: 200, y: 182 },
        { x: 380, y: 182 },
        { x: 20, y: 248 },
        { x: 200, y: 248 },
        { x: 380, y: 248 },
      ].map((pos, i) => (
        <g key={i}>
          <rect x={pos.x} y={pos.y} width="164" height="56" rx="8" fill="#1c1c22" stroke="#27272a" strokeWidth="0.5" />
          <rect x={pos.x + 12} y={pos.y + 12} width={60 + (i % 3) * 10} height="5" rx="2.5" fill="#a1a1aa" opacity="0.5" />
          <rect x={pos.x + 12} y={pos.y + 22} width={80 + (i % 2) * 20} height="4" rx="2" fill="#52525b" opacity="0.25" />
          <rect x={pos.x + 12} y={pos.y + 34} width="40" height="12" rx="6" fill="#8b5cf6" opacity="0.15" />
          <text x={pos.x + 20} y={pos.y + 43} fontSize="7" fill="#8b5cf6" fontFamily="system-ui">${65 + i * 10}</text>
        </g>
      ))}

      {/* Book Now button */}
      <rect x="210" y="318" width="140" height="36" rx="18" fill="#8b5cf6" />
      <text x="244" y="340" fontSize="11" fontWeight="700" fill="white" fontFamily="system-ui">Book Now</text>

      {/* Testimonials section */}
      <rect x="20" y="366" width="252" height="40" rx="8" fill="#1c1c22" stroke="#27272a" strokeWidth="0.5" />
      <text x="32" y="380" fontSize="10" fill="#f59e0b" fontFamily="system-ui">&quot;</text>
      <rect x="42" y="376" width="140" height="4" rx="2" fill="#71717a" opacity="0.3" />
      <rect x="42" y="384" width="100" height="4" rx="2" fill="#71717a" opacity="0.2" />
      <rect x="42" y="394" width="50" height="3" rx="1.5" fill="#52525b" opacity="0.3" />

      <rect x="288" y="366" width="252" height="40" rx="8" fill="#1c1c22" stroke="#27272a" strokeWidth="0.5" />
      <text x="300" y="380" fontSize="10" fill="#f59e0b" fontFamily="system-ui">&quot;</text>
      <rect x="310" y="376" width="130" height="4" rx="2" fill="#71717a" opacity="0.3" />
      <rect x="310" y="384" width="110" height="4" rx="2" fill="#71717a" opacity="0.2" />
      <rect x="310" y="394" width="55" height="3" rx="1.5" fill="#52525b" opacity="0.3" />
    </svg>
  );
}

// ─── 4. BookingFlowMockup ──────────────────────────────────────────────────────
export function BookingFlowMockup({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 560 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Booking flow mockup illustration"
    >
      <rect width="560" height="380" rx="12" fill="#18181b" />
      <rect x="0.5" y="0.5" width="559" height="379" rx="11.5" stroke="#27272a" />

      {/* Progress steps */}
      {[0, 1, 2].map((i) => {
        const cx = 200 + i * 80;
        const active = i === 1;
        const done = i === 0;
        return (
          <g key={i}>
            {i < 2 && (
              <line
                x1={cx + 16}
                y1="30"
                x2={cx + 64}
                y2="30"
                stroke={done ? "#8b5cf6" : "#3f3f46"}
                strokeWidth="2"
              />
            )}
            <circle
              cx={cx}
              cy="30"
              r="14"
              fill={done ? "#8b5cf6" : active ? "#8b5cf6" : "#27272a"}
              opacity={active ? 0.3 : 1}
              stroke={active ? "#8b5cf6" : "none"}
              strokeWidth="2"
            />
            {done ? (
              <path d={`M${cx - 4} 30 L${cx - 1} 33 L${cx + 5} 27`} stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <text x={cx} y="34" fontSize="10" fontWeight="700" fill={active ? "#8b5cf6" : "#71717a"} textAnchor="middle" fontFamily="system-ui">{i + 1}</text>
            )}
            <text x={cx} y="52" fontSize="7" fill={active ? "#a1a1aa" : "#52525b"} textAnchor="middle" fontFamily="system-ui">
              {["Service", "Date & Time", "Payment"][i]}
            </text>
          </g>
        );
      })}

      {/* Calendar grid */}
      <rect x="30" y="70" width="300" height="240" rx="8" fill="#1c1c22" stroke="#27272a" strokeWidth="0.5" />
      <text x="120" y="92" fontSize="10" fontWeight="600" fill="#a1a1aa" fontFamily="system-ui">March 2026</text>
      <rect x="230" y="80" width="16" height="16" rx="4" fill="#27272a" />
      <text x="235" y="92" fontSize="10" fill="#71717a" fontFamily="system-ui">&lt;</text>
      <rect x="250" y="80" width="16" height="16" rx="4" fill="#27272a" />
      <text x="255" y="92" fontSize="10" fill="#71717a" fontFamily="system-ui">&gt;</text>

      {/* Day headers */}
      {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
        <text key={i} x={54 + i * 38} y="112" fontSize="7" fill="#52525b" textAnchor="middle" fontFamily="system-ui">{d}</text>
      ))}

      {/* Calendar days */}
      {Array.from({ length: 35 }, (_, i) => {
        const day = i - 6; // offset for starting day
        if (day < 1 || day > 31) return null;
        const row = Math.floor(i / 7);
        const col = i % 7;
        const x = 38 + col * 38;
        const y = 120 + row * 30;
        const isSelected = day === 15;
        const isAvailable = [8, 10, 12, 15, 17, 19, 22, 24, 26, 29].includes(day);
        return (
          <g key={i}>
            {isSelected && (
              <rect x={x - 12} y={y - 4} width="28" height="22" rx="6" fill="#8b5cf6" />
            )}
            {isAvailable && !isSelected && (
              <rect x={x - 12} y={y - 4} width="28" height="22" rx="6" fill="#8b5cf6" opacity="0.1" />
            )}
            <text
              x={x + 2}
              y={y + 10}
              fontSize="9"
              fill={isSelected ? "white" : isAvailable ? "#a1a1aa" : "#3f3f46"}
              textAnchor="middle"
              fontFamily="system-ui"
            >
              {day}
            </text>
          </g>
        );
      })}

      {/* Time slots panel */}
      <rect x="344" y="70" width="196" height="130" rx="8" fill="#1c1c22" stroke="#27272a" strokeWidth="0.5" />
      <text x="360" y="92" fontSize="9" fontWeight="600" fill="#a1a1aa" fontFamily="system-ui">Available Times</text>
      {[
        { t: "9:00 AM", sel: false },
        { t: "10:30 AM", sel: false },
        { t: "1:00 PM", sel: true },
        { t: "2:30 PM", sel: false },
        { t: "4:00 PM", sel: false },
        { t: "5:30 PM", sel: false },
      ].map((slot, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        return (
          <g key={slot.t}>
            <rect
              x={360 + col * 86}
              y={100 + row * 28}
              width="78"
              height="22"
              rx="6"
              fill={slot.sel ? "#8b5cf6" : "#27272a"}
              opacity={slot.sel ? 1 : 0.6}
              stroke={slot.sel ? "none" : "#3f3f46"}
              strokeWidth="0.5"
            />
            <text
              x={399 + col * 86}
              y={115 + row * 28}
              fontSize="8"
              fill={slot.sel ? "white" : "#a1a1aa"}
              textAnchor="middle"
              fontFamily="system-ui"
            >
              {slot.t}
            </text>
          </g>
        );
      })}

      {/* Form fields */}
      <rect x="344" y="210" width="196" height="100" rx="8" fill="#1c1c22" stroke="#27272a" strokeWidth="0.5" />
      <text x="360" y="232" fontSize="9" fontWeight="600" fill="#a1a1aa" fontFamily="system-ui">Your Details</text>
      {[
        { label: "Full Name", y: 240 },
        { label: "Email", y: 264 },
        { label: "Birth Date", y: 288 },
      ].map((field) => (
        <g key={field.label}>
          <text x="360" y={field.y + 4} fontSize="7" fill="#52525b" fontFamily="system-ui">{field.label}</text>
          <rect x="416" y={field.y - 5} width="112" height="16" rx="4" fill="#27272a" stroke="#3f3f46" strokeWidth="0.5" />
        </g>
      ))}

      {/* Continue button */}
      <rect x="380" y="336" width="140" height="28" rx="14" fill="#8b5cf6" />
      <text x="420" y="354" fontSize="9" fontWeight="700" fill="white" fontFamily="system-ui">Continue</text>
    </svg>
  );
}

// ─── 5. MobilePhoneMockup ──────────────────────────────────────────────────────
export function MobilePhoneMockup({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 540"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Mobile phone mockup illustration"
    >
      {/* Phone frame */}
      <rect x="10" y="10" width="260" height="520" rx="32" fill="#0f0f12" stroke="#3f3f46" strokeWidth="2" />
      {/* Screen area */}
      <rect x="18" y="18" width="244" height="504" rx="28" fill="#18181b" />
      {/* Notch */}
      <rect x="90" y="18" width="100" height="22" rx="11" fill="#0f0f12" />
      <circle cx="140" cy="29" r="4" fill="#27272a" />

      {/* Status bar */}
      <text x="32" y="38" fontSize="8" fontWeight="600" fill="#71717a" fontFamily="system-ui">9:41</text>
      <rect x="216" y="30" width="18" height="8" rx="2" fill="#71717a" opacity="0.5" />
      <rect x="217" y="31" width="14" height="6" rx="1" fill="#22c55e" opacity="0.6" />

      {/* Content: Mini landing page */}
      {/* Hero gradient */}
      <defs>
        <linearGradient id="mobile-hero" x1="18" y1="44" x2="262" y2="140">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect x="18" y="44" width="244" height="100" fill="url(#mobile-hero)" />

      {/* Avatar */}
      <circle cx="140" cy="80" r="20" fill="#27272a" stroke="#8b5cf6" strokeWidth="1.5" />
      <circle cx="140" cy="74" r="7" fill="#52525b" />
      <ellipse cx="140" cy="88" rx="10" ry="7" fill="#52525b" />

      {/* Name */}
      <rect x="90" y="108" width="100" height="6" rx="3" fill="#e4e4e7" opacity="0.7" />
      <rect x="100" y="118" width="80" height="4" rx="2" fill="#71717a" opacity="0.3" />

      {/* Stars */}
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={118 + i * 11} cy="132" r="3" fill="#f59e0b" opacity="0.7" />
      ))}

      {/* Service cards */}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="28" y={150 + i * 56} width="224" height="46" rx="8" fill="#1c1c22" stroke="#27272a" strokeWidth="0.5" />
          <rect x="40" y={162 + i * 56} width={80 + i * 10} height="5" rx="2.5" fill="#a1a1aa" opacity="0.5" />
          <rect x="40" y={172 + i * 56} width={120 - i * 10} height="4" rx="2" fill="#52525b" opacity="0.25" />
          <rect x="200" y={162 + i * 56} width="36" height="14" rx="7" fill="#8b5cf6" opacity="0.15" />
          <text x="209" y={172 + i * 56} fontSize="7" fill="#8b5cf6" fontFamily="system-ui">${65 + i * 20}</text>
        </g>
      ))}

      {/* Book button */}
      <rect x="60" y="330" width="160" height="32" rx="16" fill="#8b5cf6" />
      <text x="107" y="350" fontSize="10" fontWeight="700" fill="white" fontFamily="system-ui">Book Now</text>

      {/* Testimonial card */}
      <rect x="28" y="374" width="224" height="54" rx="8" fill="#1c1c22" stroke="#27272a" strokeWidth="0.5" />
      <rect x="40" y="386" width="140" height="4" rx="2" fill="#71717a" opacity="0.3" />
      <rect x="40" y="394" width="100" height="4" rx="2" fill="#71717a" opacity="0.2" />
      <rect x="40" y="406" width="60" height="4" rx="2" fill="#52525b" opacity="0.3" />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={174 + i * 9} cy="410" r="2.5" fill="#f59e0b" opacity="0.6" />
      ))}

      {/* Bottom nav bar */}
      <rect x="18" y="440" width="244" height="82" rx="0" fill="#0f0f12" />
      <line x1="18" y1="440" x2="262" y2="440" stroke="#27272a" strokeWidth="0.5" />
      {[
        { x: 55, label: "Home" },
        { x: 104, label: "Book" },
        { x: 150, label: "Chat" },
        { x: 196, label: "Profile" },
        { x: 240, label: "More" },
      ].map((item, i) => (
        <g key={item.label}>
          <rect x={item.x - 10} y="452" width="20" height="16" rx="4" fill={i === 0 ? "#8b5cf6" : "#3f3f46"} opacity={i === 0 ? 0.3 : 0.4} />
          <text x={item.x} y="480" fontSize="6" fill={i === 0 ? "#8b5cf6" : "#52525b"} textAnchor="middle" fontFamily="system-ui">{item.label}</text>
        </g>
      ))}

      {/* Home indicator */}
      <rect x="105" y="510" width="70" height="4" rx="2" fill="#3f3f46" />
    </svg>
  );
}

// ─── 6. NatalChartIllustration ─────────────────────────────────────────────────
export function NatalChartIllustration({ className }: { className?: string }) {
  const cx = 250;
  const cy = 250;
  const outerR = 220;
  const zodiacR = 195;
  const innerR = 170;
  const houseR = 120;
  const centerR = 40;

  const zodiacSymbols = [
    "\u2648", // Aries
    "\u2649", // Taurus
    "\u264A", // Gemini
    "\u264B", // Cancer
    "\u264C", // Leo
    "\u264D", // Virgo
    "\u264E", // Libra
    "\u264F", // Scorpio
    "\u2650", // Sagittarius
    "\u2651", // Capricorn
    "\u2652", // Aquarius
    "\u2653", // Pisces
  ];

  // Planet positions (degrees from 0)
  const planets = [
    { symbol: "\u2609", deg: 15, color: "#f59e0b", label: "Sun" },    // Sun
    { symbol: "\u263D", deg: 85, color: "#a1a1aa", label: "Moon" },    // Moon
    { symbol: "\u263F", deg: 42, color: "#8b5cf6", label: "Mercury" }, // Mercury
    { symbol: "\u2640", deg: 130, color: "#22c55e", label: "Venus" },  // Venus
    { symbol: "\u2642", deg: 200, color: "#ef4444", label: "Mars" },   // Mars
    { symbol: "\u2643", deg: 260, color: "#6366f1", label: "Jupiter" },// Jupiter
    { symbol: "\u2644", deg: 310, color: "#f59e0b", label: "Saturn" }, // Saturn
  ];

  // Aspect lines connecting planets
  const aspects = [
    { from: 0, to: 3, color: "#22c55e", opacity: 0.4 },  // Sun-Venus trine
    { from: 0, to: 4, color: "#ef4444", opacity: 0.3 },  // Sun-Mars opposition
    { from: 1, to: 5, color: "#6366f1", opacity: 0.35 },  // Moon-Jupiter
    { from: 2, to: 6, color: "#8b5cf6", opacity: 0.3 },  // Mercury-Saturn
    { from: 3, to: 5, color: "#22c55e", opacity: 0.25 },  // Venus-Jupiter
    { from: 4, to: 6, color: "#ef4444", opacity: 0.2 },  // Mars-Saturn
    { from: 1, to: 2, color: "#f59e0b", opacity: 0.3 },  // Moon-Mercury
  ];

  const degToRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const polarToXY = (deg: number, r: number) => ({
    x: cx + Math.cos(degToRad(deg)) * r,
    y: cy + Math.sin(degToRad(deg)) * r,
  });

  return (
    <svg
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Natal chart illustration"
    >
      <defs>
        <radialGradient id="chart-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.05" />
          <stop offset="70%" stopColor="#18181b" stopOpacity="0" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.03" />
        </radialGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="planet-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background glow */}
      <circle cx={cx} cy={cy} r={outerR + 20} fill="url(#chart-bg)" />

      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={outerR} stroke="#8b5cf6" strokeWidth="1.5" fill="none" opacity="0.6" />
      <circle cx={cx} cy={cy} r={zodiacR} stroke="#8b5cf6" strokeWidth="0.5" fill="none" opacity="0.3" />
      <circle cx={cx} cy={cy} r={innerR} stroke="#6366f1" strokeWidth="1" fill="none" opacity="0.5" />
      <circle cx={cx} cy={cy} r={houseR} stroke="#3f3f46" strokeWidth="0.5" fill="none" opacity="0.4" />
      <circle cx={cx} cy={cy} r={centerR} stroke="#8b5cf6" strokeWidth="0.5" fill="#8b5cf6" fillOpacity="0.05" opacity="0.4" />

      {/* 12 house divisions */}
      {Array.from({ length: 12 }, (_, i) => {
        const deg = i * 30;
        const inner = polarToXY(deg, centerR);
        const outer = polarToXY(deg, innerR);
        const outerMost = polarToXY(deg, outerR);
        return (
          <g key={`house-${i}`}>
            <line
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="#3f3f46"
              strokeWidth="0.5"
              opacity="0.5"
            />
            <line
              x1={outer.x}
              y1={outer.y}
              x2={outerMost.x}
              y2={outerMost.y}
              stroke="#8b5cf6"
              strokeWidth="0.5"
              opacity="0.2"
            />
          </g>
        );
      })}

      {/* Zodiac symbols */}
      {zodiacSymbols.map((symbol, i) => {
        const deg = i * 30 + 15;
        const pos = polarToXY(deg, (zodiacR + outerR) / 2);
        return (
          <text
            key={symbol}
            x={pos.x}
            y={pos.y}
            fontSize="14"
            fill="#8b5cf6"
            opacity="0.7"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="serif"
          >
            {symbol}
          </text>
        );
      })}

      {/* Aspect lines */}
      {aspects.map((aspect, i) => {
        const fromPlanet = planets[aspect.from];
        const toPlanet = planets[aspect.to];
        const from = polarToXY(fromPlanet.deg, houseR - 10);
        const to = polarToXY(toPlanet.deg, houseR - 10);
        return (
          <line
            key={`aspect-${i}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={aspect.color}
            strokeWidth="1"
            opacity={aspect.opacity}
            strokeDasharray={i % 2 === 0 ? "none" : "4 2"}
          />
        );
      })}

      {/* Planet symbols */}
      {planets.map((planet) => {
        const pos = polarToXY(planet.deg, (innerR + houseR) / 2);
        return (
          <g key={planet.label} filter="url(#planet-glow)">
            <circle cx={pos.x} cy={pos.y} r="10" fill={planet.color} fillOpacity="0.1" />
            <text
              x={pos.x}
              y={pos.y}
              fontSize="14"
              fill={planet.color}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="serif"
            >
              {planet.symbol}
            </text>
          </g>
        );
      })}

      {/* Decorative outer dots */}
      {Array.from({ length: 72 }, (_, i) => {
        const deg = i * 5;
        const pos = polarToXY(deg, outerR + 8);
        return (
          <circle
            key={`dot-${i}`}
            cx={pos.x}
            cy={pos.y}
            r={i % 6 === 0 ? 1.5 : 0.5}
            fill="#8b5cf6"
            opacity={i % 6 === 0 ? 0.5 : 0.2}
          />
        );
      })}

      {/* ASC / MC labels */}
      <text x={cx + outerR + 14} y={cy + 4} fontSize="8" fill="#8b5cf6" opacity="0.6" fontFamily="system-ui" fontWeight="600">ASC</text>
      <text x={cx - 4} y={cy - outerR - 8} fontSize="8" fill="#8b5cf6" opacity="0.6" fontFamily="system-ui" fontWeight="600" textAnchor="middle">MC</text>
    </svg>
  );
}

// ─── 7. TarotSpreadIllustration ────────────────────────────────────────────────
export function TarotSpreadIllustration({ className }: { className?: string }) {
  const cardW = 48;
  const cardH = 76;

  // Celtic Cross positions (approximate layout)
  const cards = [
    { x: 200, y: 160, label: "Present", rot: 0 },
    { x: 200, y: 160, label: "Challenge", rot: 90 },
    { x: 200, y: 72, label: "Above", rot: 0 },
    { x: 200, y: 248, label: "Below", rot: 0 },
    { x: 112, y: 160, label: "Past", rot: 0 },
    { x: 288, y: 160, label: "Future", rot: 0 },
    { x: 380, y: 268, label: "Self", rot: 0 },
    { x: 380, y: 196, label: "Environment", rot: 0 },
    { x: 380, y: 124, label: "Hopes", rot: 0 },
    { x: 380, y: 52, label: "Outcome", rot: 0 },
  ];

  return (
    <svg
      viewBox="0 0 480 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Tarot Celtic Cross spread illustration"
    >
      <defs>
        <linearGradient id="card-back" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#6366f1" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
        </linearGradient>
        <filter id="card-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern id="card-pattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="4" r="0.5" fill="#8b5cf6" opacity="0.4" />
          <line x1="0" y1="0" x2="8" y2="8" stroke="#8b5cf6" strokeWidth="0.2" opacity="0.15" />
          <line x1="8" y1="0" x2="0" y2="8" stroke="#6366f1" strokeWidth="0.2" opacity="0.15" />
        </pattern>
      </defs>

      {cards.map((card, i) => {
        const isCenter = i <= 1;
        return (
          <g
            key={card.label}
            transform={card.rot ? `rotate(${card.rot} ${card.x + cardW / 2} ${card.y + cardH / 2})` : undefined}
            filter={isCenter ? "url(#card-glow)" : undefined}
          >
            {/* Card shadow */}
            <rect
              x={card.x + 2}
              y={card.y + 2}
              width={cardW}
              height={cardH}
              rx="5"
              fill="black"
              opacity="0.3"
            />
            {/* Card body */}
            <rect
              x={card.x}
              y={card.y}
              width={cardW}
              height={cardH}
              rx="5"
              fill="#1c1c22"
              stroke={isCenter ? "#8b5cf6" : "#3f3f46"}
              strokeWidth={isCenter ? 1.5 : 0.5}
            />
            {/* Card back pattern */}
            <rect
              x={card.x + 4}
              y={card.y + 4}
              width={cardW - 8}
              height={cardH - 8}
              rx="3"
              fill="url(#card-pattern)"
              stroke="#8b5cf6"
              strokeWidth="0.3"
              opacity="0.6"
            />
            {/* Decorative diamond */}
            <polygon
              points={`${card.x + cardW / 2},${card.y + 12} ${card.x + cardW - 10},${card.y + cardH / 2} ${card.x + cardW / 2},${card.y + cardH - 12} ${card.x + 10},${card.y + cardH / 2}`}
              stroke="#8b5cf6"
              strokeWidth="0.5"
              fill="none"
              opacity="0.3"
            />
            {/* Center star */}
            <circle
              cx={card.x + cardW / 2}
              cy={card.y + cardH / 2}
              r="6"
              fill="#8b5cf6"
              opacity="0.15"
            />
            <circle
              cx={card.x + cardW / 2}
              cy={card.y + cardH / 2}
              r="2"
              fill="#8b5cf6"
              opacity="0.4"
            />
          </g>
        );
      })}

      {/* Labels - drawn after cards so they appear on top */}
      {cards.map((card) => (
        <text
          key={`label-${card.label}`}
          x={card.x + cardW / 2}
          y={card.rot === 90 ? card.y + cardH + 18 : card.y + cardH + 12}
          fontSize="6.5"
          fill="#71717a"
          textAnchor="middle"
          fontFamily="system-ui"
        >
          {card.label}
        </text>
      ))}

      {/* Decorative connecting lines */}
      <line x1="160" y1="198" x2="200" y2="198" stroke="#3f3f46" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.3" />
      <line x1="248" y1="198" x2="288" y2="198" stroke="#3f3f46" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.3" />
      <line x1="224" y1="148" x2="224" y2="160" stroke="#3f3f46" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.3" />
      <line x1="224" y1="236" x2="224" y2="248" stroke="#3f3f46" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.3" />
      {/* Line to staff column */}
      <line x1="336" y1="198" x2="380" y2="198" stroke="#3f3f46" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.3" />
    </svg>
  );
}

// ─── 8. ShareHubMockup ─────────────────────────────────────────────────────────
export function ShareHubMockup({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 560 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Share hub mockup illustration"
    >
      <rect width="560" height="380" rx="12" fill="#18181b" />
      <rect x="0.5" y="0.5" width="559" height="379" rx="11.5" stroke="#27272a" />

      {/* Phone mockup on the left */}
      <rect x="30" y="30" width="160" height="320" rx="20" fill="#0f0f12" stroke="#3f3f46" strokeWidth="1.5" />
      <rect x="36" y="36" width="148" height="308" rx="17" fill="#18181b" />
      {/* Notch */}
      <rect x="75" y="36" width="60" height="14" rx="7" fill="#0f0f12" />

      {/* Phone content preview */}
      <rect x="44" y="58" width="132" height="80" rx="6" fill="#1c1c22" />
      <defs>
        <linearGradient id="share-preview" x1="44" y1="58" x2="176" y2="138">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect x="44" y="58" width="132" height="80" rx="6" fill="url(#share-preview)" />
      <circle cx="110" cy="86" r="14" fill="#27272a" stroke="#8b5cf6" strokeWidth="1" />
      <rect x="80" y="108" width="60" height="4" rx="2" fill="#a1a1aa" opacity="0.4" />
      <rect x="86" y="116" width="48" height="3" rx="1.5" fill="#71717a" opacity="0.3" />
      <rect x="66" y="126" width="88" height="6" rx="3" fill="#52525b" opacity="0.2" />

      {/* Caption area */}
      <rect x="44" y="146" width="132" height="60" rx="6" fill="#1c1c22" stroke="#27272a" strokeWidth="0.5" />
      <text x="52" y="160" fontSize="6" fill="#71717a" fontFamily="system-ui">Caption</text>
      <rect x="52" y="166" width="110" height="3" rx="1.5" fill="#52525b" opacity="0.3" />
      <rect x="52" y="173" width="90" height="3" rx="1.5" fill="#52525b" opacity="0.25" />
      <rect x="52" y="180" width="70" height="3" rx="1.5" fill="#52525b" opacity="0.2" />
      {/* Hashtags */}
      <rect x="52" y="190" width="40" height="8" rx="4" fill="#8b5cf6" opacity="0.15" />
      <text x="57" y="196" fontSize="5" fill="#8b5cf6" fontFamily="system-ui">#astrology</text>
      <rect x="96" y="190" width="32" height="8" rx="4" fill="#6366f1" opacity="0.15" />
      <text x="100" y="196" fontSize="5" fill="#6366f1" fontFamily="system-ui">#tarot</text>

      {/* Share button on phone */}
      <rect x="52" y="216" width="116" height="22" rx="11" fill="#8b5cf6" />
      <text x="82" y="231" fontSize="8" fontWeight="700" fill="white" fontFamily="system-ui">Share Now</text>

      {/* Right panel - Platforms list */}
      <rect x="220" y="30" width="320" height="320" rx="10" fill="#1c1c22" stroke="#27272a" strokeWidth="0.5" />
      <text x="240" y="56" fontSize="11" fontWeight="600" fill="#a1a1aa" fontFamily="system-ui">Share to Platforms</text>

      {/* Progress bar */}
      <rect x="240" y="66" width="280" height="6" rx="3" fill="#27272a" />
      <rect x="240" y="66" width="187" height="6" rx="3" fill="#8b5cf6" />
      <text x="240" y="84" fontSize="7" fill="#71717a" fontFamily="system-ui">4 of 6 platforms shared</text>

      {/* Platform rows */}
      {[
        { name: "Instagram", status: "done", color: "#E4405F" },
        { name: "TikTok", status: "done", color: "#a1a1aa" },
        { name: "Facebook", status: "done", color: "#1877F2" },
        { name: "X / Twitter", status: "done", color: "#a1a1aa" },
        { name: "YouTube", status: "pending", color: "#FF0000" },
        { name: "LinkedIn", status: "pending", color: "#0A66C2" },
      ].map((platform, i) => (
        <g key={platform.name}>
          <rect
            x="240"
            y={96 + i * 40}
            width="280"
            height="32"
            rx="8"
            fill={platform.status === "done" ? "#22c55e" : "#27272a"}
            opacity={platform.status === "done" ? 0.05 : 0.4}
            stroke={platform.status === "done" ? "#22c55e" : "#3f3f46"}
            strokeWidth="0.5"
          />
          {/* Platform icon placeholder */}
          <circle
            cx="260"
            cy={112 + i * 40}
            r="8"
            fill={platform.color}
            opacity="0.2"
          />
          <rect
            x="256"
            y={108 + i * 40}
            width="8"
            height="8"
            rx="2"
            fill={platform.color}
            opacity="0.5"
          />
          <text
            x="278"
            y={116 + i * 40}
            fontSize="9"
            fill="#a1a1aa"
            fontFamily="system-ui"
          >
            {platform.name}
          </text>
          {/* Status indicator */}
          {platform.status === "done" ? (
            <g>
              <circle cx="498" cy={112 + i * 40} r="8" fill="#22c55e" opacity="0.2" />
              <path
                d={`M${494} ${112 + i * 40} L${497} ${115 + i * 40} L${503} ${109 + i * 40}`}
                stroke="#22c55e"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ) : (
            <rect x="488" y={106 + i * 40} width="22" height="12" rx="6" fill="#8b5cf6" opacity="0.2" />
          )}
          {platform.status !== "done" && (
            <text x="493" y={115 + i * 40} fontSize="6" fill="#8b5cf6" fontFamily="system-ui">Share</text>
          )}
        </g>
      ))}
    </svg>
  );
}
