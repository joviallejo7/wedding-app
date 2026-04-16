"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RsvpEntry {
  name: string;
  count: number;
  event: string;
  timestamp: number;
}

// ─── Countdown ────────────────────────────────────────────────────────────────

const WEDDING_DATE = new Date("2026-06-29T00:00:00");

function useCountdown(target: Date) {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const calc = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) return setT({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setT({
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [target]);
  return t;
}
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

// ─── FadeUp ───────────────────────────────────────────────────────────────────

function FadeUp({ children, delay = 0, show = true }: {
  children: React.ReactNode; delay?: number; show?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!show) { setVisible(false); return; }
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay, show]);
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(22px)",
      transition: "opacity 1.2s cubic-bezier(0.22,1,0.36,1), transform 1.2s cubic-bezier(0.22,1,0.36,1)",
    }}>
      {children}
    </div>
  );
}

// ─── Floating Orbs ────────────────────────────────────────────────────────────

function Orb({ size, x, y, color, duration, delay: delayS }: {
  size: number; x: string; y: string; color: string; duration: number; delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dx = useRef((Math.random() - 0.5) * 60);
  const dy = useRef((Math.random() - 0.5) * 60);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let frame: number;
    const start = performance.now() - delayS * 1000;
    const animate = (ts: number) => {
      const elapsed = (ts - start) / 1000;
      const sine = Math.sin((elapsed / duration) * Math.PI * 2);
      el.style.transform = `translate(${dx.current * sine}px, ${dy.current * sine}px)`;
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [duration, delayS]);
  return (
    <div ref={ref} style={{
      position: "absolute", left: x, top: y,
      width: size, height: size, borderRadius: "50%",
      background: color, filter: `blur(${size * 0.55}px)`,
      opacity: 0.3, pointerEvents: "none",
    }} />
  );
}

function FloatingOrbs() {
  const orbs = [
    { size: 320, x: "10%", y: "15%", color: "radial-gradient(circle, #c4a46860, transparent)", duration: 18, delay: 0 },
    { size: 240, x: "70%", y: "60%", color: "radial-gradient(circle, #a07840, transparent)",   duration: 22, delay: 3 },
    { size: 180, x: "55%", y: "5%",  color: "radial-gradient(circle, #c4a46840, transparent)", duration: 15, delay: 1.5 },
    { size: 280, x: "5%",  y: "65%", color: "radial-gradient(circle, #80603040, transparent)", duration: 25, delay: 5 },
    { size: 150, x: "80%", y: "10%", color: "radial-gradient(circle, #c4a46830, transparent)", duration: 12, delay: 2 },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {orbs.map((o, i) => <Orb key={i} {...o} />)}
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function GoldDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "28px auto", width: "100%", maxWidth: 320 }}>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, rgba(196,164,104,0.4))" }} />
      <span style={{ color: "rgba(196,164,104,0.5)", fontSize: 8 }}>◆</span>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, rgba(196,164,104,0.4))" }} />
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ ornament, title }: { ornament: string; title: string }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 40 }}>
      <div style={{ fontFamily: "var(--font-cormorant),serif", color: "rgba(196,164,104,0.4)", fontSize: 22, marginBottom: 12 }}>
        {ornament}
      </div>
      <h3 style={{
        fontFamily: "var(--font-playfair),serif",
        color: "#e8dfc8",
        fontSize: "clamp(1.4rem,4vw,2.2rem)",
        letterSpacing: "0.05em",
        fontWeight: 400,
      }}>{title}</h3>
      <div style={{ height: 1, width: 40, background: "rgba(196,164,104,0.35)", margin: "16px auto 0" }} />
    </div>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({ tag, title, date, time, venue, hall, mapsUrl, families, palette, outfitImages}: {
  tag: string; title: string; date: string; time: string;
  venue: string; hall: string; mapsUrl: string; families: string; palette?: string[]; outfitImages?: string[];
}) {
  const [showOutfits, setShowOutfits] = useState(false);
  return (
    <div style={{
      border: "1px solid rgba(196,164,104,0.18)",
      padding: "40px 36px",
      maxWidth: 480,
      width: "100%",
      position: "relative",
      background: "rgba(196,164,104,0.02)",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 12, height: 12, borderTop: "1px solid rgba(196,164,104,0.5)", borderLeft: "1px solid rgba(196,164,104,0.5)" }} />
      <div style={{ position: "absolute", top: 0, right: 0, width: 12, height: 12, borderTop: "1px solid rgba(196,164,104,0.5)", borderRight: "1px solid rgba(196,164,104,0.5)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, width: 12, height: 12, borderBottom: "1px solid rgba(196,164,104,0.5)", borderLeft: "1px solid rgba(196,164,104,0.5)" }} />
      <div style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderBottom: "1px solid rgba(196,164,104,0.5)", borderRight: "1px solid rgba(196,164,104,0.5)" }} />

      <p style={{ fontFamily: "var(--font-cormorant),serif", color: "#c4a468", fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase" as const, marginBottom: 16, opacity: 0.8 }}>
        {tag}
      </p>

      <h4 style={{ fontFamily: "var(--font-playfair),serif", color: "#e8dfc8", fontSize: "clamp(1.3rem,3vw,1.8rem)", fontWeight: 400, marginBottom: 24 }}>
        {title}
      </h4>

      <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
        <Row label="Date"      value={date} />
        <Row label="Time"      value={time} />
        <Row label="Venue"     value={venue} />
        <Row label="Reception" value={hall + " · 1:00 PM"} />
        <Row label="Hosted by" value={families} />
        <PaletteRow colors={palette || []} />
        <OutfitRow onClick={() => setShowOutfits(true)} />
        {showOutfits && (
  <div
    onClick={() => setShowOutfits(false)}
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.85)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 999,
      backdropFilter: "blur(6px)"
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: "#0B0B0B",
        border: "1px solid rgba(196,164,104,0.3)",
        padding: 24,
        maxWidth: 700,
        width: "90%",
        display: "grid",
        gridTemplateColumns: "repeat(2,1fr)",
        gap: 12,
      }}
    >
      {outfitImages?.map((img, i) => (
        <img
          key={i}
          src={img}
          style={{
            width: "100%",
            height: "220px",
            objectFit: "cover",
            border: "1px solid rgba(196,164,104,0.2)"
          }}
        />
      ))}
    </div>
  </div>
)}
      </div>
      <a
  href={mapsUrl}
  target="_blank"
  rel="noopener noreferrer"
  style={{
    display: "inline-block",
    marginTop: 28,
    fontFamily: "var(--font-cormorant),serif",
    color: "#c4a468",
    fontSize: 11,
    letterSpacing: "0.35em",
    textTransform: "uppercase",
    textDecoration: "none",
    borderBottom: "1px solid rgba(196,164,104,0.3)",
    paddingBottom: 3,
  }}
>
  Get Directions
</a>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      <span style={{ color: "#c4a468", fontSize: 12, marginTop: 2, opacity: 0.7, flexShrink: 0 }}>—</span>
      <div>
        <span style={{ fontFamily: "var(--font-cormorant),serif", color: "rgba(168,144,112,0.6)", fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase" as const, display: "block", marginBottom: 2 }}>
          {label}
        </span>
        <span style={{ fontFamily: "var(--font-cormorant),serif", color: "#c8b99a", fontSize: "clamp(0.9rem,2vw,1.05rem)", lineHeight: 1.5 }}>
          {value}
        </span>
      </div>
    </div>
  );
}

function PaletteRow({ colors }: { colors: string[] }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      <span style={{ color: "#c4a468", fontSize: 12, marginTop: 2, opacity: 0.7 }}>—</span>

      <div>
        <span style={{
          fontFamily: "var(--font-cormorant),serif",
          color: "rgba(168,144,112,0.6)",
          fontSize: 10,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          display: "block",
          marginBottom: 6,
        }}>
          Colour Palette
        </span>

        <div style={{ display: "flex", gap: 8 }}>
          {colors.map((c, i) => (
            <div key={i} style={{
              width: 18,
              height: 18,
              background: c,
              border: "1px solid rgba(196,164,104,0.3)"
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function OutfitRow({ onClick }: { onClick: () => void }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      <span style={{ color: "#c4a468", fontSize: 12, marginTop: 2, opacity: 0.7 }}>—</span>

      <div>
        <span style={{
          fontFamily: "var(--font-cormorant),serif",
          color: "rgba(168,144,112,0.6)",
          fontSize: 10,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          display: "block",
          marginBottom: 6,
        }}>
          Outfit Inspiration
        </span>

        <button
          onClick={onClick}
          style={{
            border: "1px solid rgba(196,164,104,0.4)",
            padding: "6px 10px",
            background: "transparent",
            color: "#c4a468",
            fontSize: 11,
            cursor: "pointer"
          }}
        >
          View ✦
        </button>
      </div>
    </div>
  );
}

// ─── RSVP ─────────────────────────────────────────────────────────────────────

function RsvpSection() {
  const [rsvps, setRsvps] = useState<RsvpEntry[]>([]);
  const [name, setName]   = useState("");
  const [count, setCount] = useState(1);
  const [event, setEvent] = useState("both");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
  const fetchRsvps = async () => {
    const { data, error } = await supabase.from("rsvps").select("*");

    if (error) {
      console.error(error);
      return;
    }

    setRsvps(data || []);
  };

  fetchRsvps();
}, []);

  const totalGuests = rsvps.reduce((s, r) => s + r.count, 0);

  const handleSubmit = async () => {
  if (!name.trim()) {
    setError("Please enter your name.");
    return;
  }

  if (count < 1 || count > 20) {
    setError("Please enter a valid guest count.");
    return;
  }

  setError("");

  const { error } = await supabase.from("rsvps").insert([
    {
      name: name.trim(),
      count,
      event,
    },
  ]);

  if (error) {
    console.error(error);
    setError("Something went wrong. Try again.");
    return;
  }

  setSubmitted(true);
  // Refresh data from DB
  const { data } = await supabase.from("rsvps").select("*");
  setRsvps(data || []);
};

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(196,164,104,0.04)",
    border: "1px solid rgba(196,164,104,0.2)",
    color: "#e8dfc8",
    fontFamily: "var(--font-cormorant),serif",
    fontSize: "1rem",
    letterSpacing: "0.05em",
    padding: "12px 16px",
    outline: "none",
    transition: "border-color 0.3s ease",
    boxSizing: "border-box" as const,
  };

  return (
    <section style={{
      minHeight: "80vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "80px 24px",
      borderTop: "1px solid rgba(196,164,104,0.08)",
      position: "relative",
    }}>
      <SectionHeader ornament="✦" title="RSVP" />

      {/* Guest counter */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        marginBottom: 48,
      }}>
        <span style={{
          fontFamily: "var(--font-playfair),serif",
          color: "#c4a468",
          fontSize: "clamp(2rem,6vw,4rem)",
          lineHeight: 1,
        }}>{totalGuests}</span>
        <span style={{
          fontFamily: "var(--font-cormorant),serif",
          color: "#a89070",
          fontSize: 11,
          letterSpacing: "0.4em",
          textTransform: "uppercase",
        }}>Guests Attending</span>
        <span style={{
          fontFamily: "var(--font-cormorant),serif",
          color: "rgba(168,144,112,0.45)",
          fontSize: 12,
          letterSpacing: "0.15em",
          marginTop: 4,
        }}>from {rsvps.length} {rsvps.length === 1 ? "family" : "families"}</span>
      </div>

      {submitted ? (
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ color: "#c4a468", fontSize: 28, marginBottom: 16 }}>✦</div>
          <p style={{
            fontFamily: "var(--font-playfair),serif",
            color: "#e8dfc8",
            fontSize: "clamp(1.1rem,3vw,1.5rem)",
            marginBottom: 12,
          }}>Thank you, {name}!</p>
          <p style={{
            fontFamily: "var(--font-cormorant),serif",
            color: "#a89070",
            fontSize: "1rem",
            letterSpacing: "0.08em",
            lineHeight: 1.8,
          }}>
            Your presence of {count} {count === 1 ? "guest" : "guests"} has been noted.<br />
            We look forward to celebrating with you.
          </p>
        </div>
      ) : (
        <div style={{ width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: 16 }}>
          {error && (
            <p style={{
              fontFamily: "var(--font-cormorant),serif",
              color: "rgba(220,120,100,0.9)",
              fontSize: "0.9rem",
              letterSpacing: "0.05em",
              textAlign: "center",
            }}>{error}</p>
          )}

          <div>
            <label style={{
              fontFamily: "var(--font-cormorant),serif",
              color: "rgba(168,144,112,0.6)",
              fontSize: 10,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              display: "block",
              marginBottom: 8,
            }}>Your Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Full name"
              style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = "rgba(196,164,104,0.6)"}
              onBlur={e => e.currentTarget.style.borderColor = "rgba(196,164,104,0.2)"}
            />
          </div>

          <div>
            <label style={{
              fontFamily: "var(--font-cormorant),serif",
              color: "rgba(168,144,112,0.6)",
              fontSize: 10,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              display: "block",
              marginBottom: 8,
            }}>Number of Guests</label>
            <input
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={e => setCount(Math.max(1, parseInt(e.target.value) || 1))}
              style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = "rgba(196,164,104,0.6)"}
              onBlur={e => e.currentTarget.style.borderColor = "rgba(196,164,104,0.2)"}
            />
          </div>

          <div>
            <label style={{
              fontFamily: "var(--font-cormorant),serif",
              color: "rgba(168,144,112,0.6)",
              fontSize: 10,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              display: "block",
              marginBottom: 8,
            }}>Attending</label>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { value: "betrothal", label: "Betrothal · Jun 21" },
                { value: "wedding",   label: "Wedding · Jun 29"   },
                { value: "both",      label: "Both Events"        },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setEvent(opt.value)}
                  style={{
                    flex: 1,
                    padding: "10px 8px",
                    border: event === opt.value
                      ? "1px solid rgba(196,164,104,0.7)"
                      : "1px solid rgba(196,164,104,0.18)",
                    background: event === opt.value ? "rgba(196,164,104,0.1)" : "transparent",
                    color: event === opt.value ? "#c4a468" : "#a89070",
                    fontFamily: "var(--font-cormorant),serif",
                    fontSize: "0.75rem",
                    letterSpacing: "0.1em",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            style={{
              marginTop: 8,
              padding: "14px 48px",
              border: "1px solid rgba(196,164,104,0.4)",
              color: "#c4a468",
              background: "transparent",
              fontFamily: "var(--font-cormorant),serif",
              fontSize: 11,
              letterSpacing: "0.45em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.4s ease",
              alignSelf: "center",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(196,164,104,0.08)";
              e.currentTarget.style.borderColor = "#c4a468";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "rgba(196,164,104,0.4)";
            }}
          >
            Confirm Attendance
          </button>
        </div>
      )}
    </section>
  );
}

// ─── Countdown Units ──────────────────────────────────────────────────────────

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <span style={{
        fontFamily: "var(--font-playfair),serif",
        fontSize: "clamp(1.6rem,4vw,2.8rem)",
        color: "#e8dfc8",
        letterSpacing: "0.05em",
        lineHeight: 1,
        fontVariantNumeric: "tabular-nums",
      }}>{String(value).padStart(2, "0")}</span>
      <span style={{
        fontFamily: "var(--font-cormorant),serif",
        textTransform: "uppercase",
        letterSpacing: "0.3em",
        fontSize: 10,
        color: "#a89070",
      }}>{label}</span>
    </div>
  );
}

function Sep() {
  return (
    <span style={{
      fontFamily: "var(--font-cormorant),serif",
      color: "rgba(196,164,104,0.3)",
      fontSize: "clamp(1.2rem,3vw,2rem)",
      lineHeight: 1,
      paddingBottom: "1.3rem",
      userSelect: "none",
    }}>/</span>
  );
}

// ─── Curtain ──────────────────────────────────────────────────────────────────

function Curtain({ active }: { active: boolean }) {
  return (
    <>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: "50vh",
        backgroundColor: "#060606", zIndex: 50, transformOrigin: "top",
        transform: active ? "scaleY(1)" : "scaleY(0)",
        transition: active
          ? "transform 0.8s cubic-bezier(0.76,0,0.24,1)"
          : "transform 1s cubic-bezier(0.76,0,0.24,1) 0.3s",
      }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, height: "50vh",
        backgroundColor: "#060606", zIndex: 50, transformOrigin: "bottom",
        transform: active ? "scaleY(1)" : "scaleY(0)",
        transition: active
          ? "transform 0.8s cubic-bezier(0.76,0,0.24,1)"
          : "transform 1s cubic-bezier(0.76,0,0.24,1) 0.3s",
      }} />
    </>
  );
}

// ─── Music Player ─────────────────────────────────────────────────────────────

function MusicPlayer({ playing, onToggle }: { playing: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={playing ? "Mute music" : "Play music"}
      style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        zIndex: 200,
        width: 42,
        height: 42,
        borderRadius: "50%",
        border: "1px solid rgba(196,164,104,0.35)",
        background: "rgba(11,11,11,0.85)",
        color: "#c4a468",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        backdropFilter: "blur(8px)",
        transition: "border-color 0.3s ease, transform 0.3s ease",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#c4a468"; e.currentTarget.style.transform = "scale(1.1)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(196,164,104,0.35)"; e.currentTarget.style.transform = "scale(1)"; }}
    >
      {playing ? "♪" : "♩"}
    </button>
  );
}

// ─── Inner Site ───────────────────────────────────────────────────────────────

function InnerSite({ visible }: { visible: boolean }) {
  const isMobile = useIsMobile();  // ← add this line at top of InnerSite
  return (
    <div style={{
      position: "absolute", inset: 0,
      overflowY: "auto",
      opacity: visible ? 1 : 0,
      transition: "opacity 1.4s ease 0.5s",
      pointerEvents: visible ? "auto" : "none",
      backgroundColor: "#0B0B0B",
    }}>
      <FloatingOrbs />

      {/* Hero */}
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        position: "relative", padding: "80px 24px",
      }}>
        <FadeUp delay={200} show={visible}>
          <p style={{
            fontFamily: "var(--font-cormorant),serif", fontStyle: "italic",
            color: "#c4a468", letterSpacing: "0.3em", fontSize: 12,
            textTransform: "uppercase", textAlign: "center", marginBottom: 32,
          }}>Welcome · You are invited</p>
        </FadeUp>

        <FadeUp delay={400} show={visible}>
          <p style={{
            fontFamily: "var(--font-cormorant),serif", color: "#a89070",
            fontSize: "clamp(0.8rem,2vw,1rem)", letterSpacing: "0.2em",
            textAlign: "center", marginBottom: 16, lineHeight: 1.8,
          }}>
            Mr. Lejo Alex &amp; Mrs. Prasanthi Varghese · Kalladal, Mavelikkara<br />
            <span style={{ opacity: 0.5 }}>&amp;</span><br />
            Mr. Davis Joseph &amp; Mrs. Regimol Thomas · Emprayil, Pala
          </p>
        </FadeUp>

        <FadeUp delay={550} show={visible}>
          <p style={{
            fontFamily: "var(--font-cormorant),serif", color: "rgba(168,144,112,0.6)",
            fontSize: 11, letterSpacing: "0.25em", textAlign: "center",
            marginBottom: 20, textTransform: "uppercase",
          }}>Request the pleasure of your presence</p>
        </FadeUp>

        <FadeUp delay={700} show={visible}>
          <h2 style={{
            fontFamily: "var(--font-playfair),serif",
            fontSize: "clamp(2.5rem,8vw,6rem)",
            color: "#e8dfc8", textAlign: "center",
            lineHeight: 1.1, letterSpacing: "0.02em",
          }}>
            Jovial{" "}
            <span style={{ color: "#c4a468", fontStyle: "italic" }}>&amp;</span>{" "}
            Anoopa
          </h2>
        </FadeUp>

        <FadeUp delay={900} show={visible}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, margin: "24px 0" }}>
            <div style={{ height: 1, width: 80, background: "linear-gradient(to right, transparent, rgba(196,164,104,0.4))" }} />
            <span style={{ color: "rgba(196,164,104,0.5)", fontSize: 8 }}>◆</span>
            <div style={{ height: 1, width: 80, background: "linear-gradient(to left, transparent, rgba(196,164,104,0.4))" }} />
          </div>
        </FadeUp>

        {/* Scroll cue */}
        <FadeUp delay={1200} show={visible}>
          <div style={{ marginTop: 60, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <span style={{
              fontFamily: "var(--font-cormorant),serif",
              color: "rgba(196,164,104,0.4)", fontSize: 10,
              letterSpacing: "0.4em", textTransform: "uppercase",
            }}>Scroll</span>
            <div style={{ width: 1, height: 48, background: "linear-gradient(to bottom, rgba(196,164,104,0.4), transparent)" }} />
          </div>
        </FadeUp>
      </div>

      {/* Events Section */}
      <section style={{
        padding: "80px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        borderTop: "1px solid rgba(196,164,104,0.08)",
        position: "relative",
      }}>
        <FadeUp delay={200} show={visible}>
          <SectionHeader ornament="◇" title="The Celebrations" />
        </FadeUp>

        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",  // ← key line
          gap: 28,
          justifyContent: "center",
          alignItems: isMobile ? "center" : "flex-start",
          width: "100%",
          maxWidth: 1040,
        }}>
          <FadeUp delay={350} show={visible}>
            <EventCard
              tag="Event 01 · Betrothal"
              title="The Betrothal"
              date="Sunday, 21 June 2026"
              time="12:30 PM — Ceremony"
              venue="Mar Sleeva Syro-Malabar Church, Cherpunkal"
              hall="Mar Sleeva Parish Hall"
              mapsUrl="https://maps.google.com/?q=Mar+Sleeva+Syro+Malabar+Church+Cherpunkal"
              families="Mr. Davis Joseph & Mrs. Regimol Thomas"
              palette={["#911D48", "#0F1A1F", "#BBA995"]}
              outfitImages={["/outfit1.jpg","/outfit3.jpg"]}
            />
          </FadeUp>

          <FadeUp delay={500} show={visible}>
            <EventCard
              tag="Event 02 · Wedding"
              title="The Wedding"
              date="Monday, 29 June 2026"
              time="11:00 AM — Holy Matrimony"
              venue="St. Mary's Orthodox Cathedral, Mavelikkara"
              hall="St. Mary's Orthodox Parish Hall"
              mapsUrl="https://maps.google.com/?q=St+Mary%27s+Orthodox+Cathedral+Mavelikkara"
              families="Mr. Lejo Alex & Mrs. Prasanthi Varghese"
              palette={["#F6593C", "#533B37", "#EECC9E"]}
              outfitImages={["/outfit2.jpg","/outfit4.jpg"]}
            />
          </FadeUp>
        </div>
      </section>

      {/* RSVP */}
      <RsvpSection />

      {/* Footer */}
      <footer style={{
        padding: "48px 24px", textAlign: "center",
        borderTop: "1px solid rgba(196,164,104,0.08)",
      }}>
        <p style={{
          fontFamily: "var(--font-cormorant),serif", fontStyle: "italic",
          color: "rgba(168,144,112,0.4)", fontSize: 13, letterSpacing: "0.2em",
        }}>Jovial &amp; Anoopa</p>
      </footer>
    </div>
  );
}

// ─── Landing Screen ───────────────────────────────────────────────────────────

function LandingScreen({ onEnter }: { onEnter: () => void }) {
  const { days, hours, minutes, seconds } = useCountdown(WEDDING_DATE);
  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "0 24px",
    }}>
      <FloatingOrbs />

      <FadeUp delay={100}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40 }}>
          <div style={{ height: 1, width: 64, background: "linear-gradient(to right, transparent, #c4a468)" }} />
          <span style={{
            fontFamily: "var(--font-cormorant),serif", color: "#c4a468",
            letterSpacing: "0.35em", fontSize: 11, textTransform: "uppercase", opacity: 0.7,
          }}>2026</span>
          <div style={{ height: 1, width: 64, background: "linear-gradient(to left, transparent, #c4a468)" }} />
        </div>
      </FadeUp>

      <FadeUp delay={280}>
        <h1 style={{
          fontFamily: "var(--font-playfair),serif",
          fontSize: "clamp(3rem,10vw,8rem)",
          color: "#e8dfc8", letterSpacing: "0.03em",
          textAlign: "center", lineHeight: 1,
        }}>
          Jovial
          <span style={{
            display: "block", fontFamily: "var(--font-cormorant),serif",
            fontStyle: "italic", fontWeight: 300, color: "#c4a468",
            fontSize: "clamp(1.2rem,3.5vw,2.8rem)", letterSpacing: "0.25em", margin: "4px 0",
          }}>&amp;</span>
          Anoopa
        </h1>
      </FadeUp>

      <FadeUp delay={480}>
        <GoldDivider />
      </FadeUp>

      <FadeUp delay={580}>
        <p style={{
          fontFamily: "var(--font-cormorant),serif", fontStyle: "italic",
          fontWeight: 300, fontSize: "clamp(0.9rem,2.2vw,1.25rem)",
          color: "#a89070", letterSpacing: "0.2em", textAlign: "center",
        }}>Together with their families</p>
      </FadeUp>

      <FadeUp delay={720}>
        <p style={{
          fontFamily: "var(--font-playfair),serif", fontSize: 11, color: "#c4a468",
          letterSpacing: "0.3em", textTransform: "uppercase",
          textAlign: "center", marginTop: 20,
        }}>June 29, 2026</p>
      </FadeUp>

      <FadeUp delay={880}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "clamp(16px,4vw,40px)", marginTop: 32 }}>
          <CountdownUnit value={days}    label="Days"    />
          <Sep /><CountdownUnit value={hours}   label="Hours"   />
          <Sep /><CountdownUnit value={minutes} label="Minutes" />
          <Sep /><CountdownUnit value={seconds} label="Seconds" />
        </div>
      </FadeUp>

      <FadeUp delay={1080}>
        <button
          onClick={onEnter}
          style={{
            marginTop: 56,
            fontFamily: "var(--font-cormorant),serif",
            letterSpacing: "0.45em", fontSize: 11,
            textTransform: "uppercase", padding: "14px 52px",
            border: "1px solid rgba(196,164,104,0.35)",
            color: "#c4a468", background: "transparent",
            cursor: "pointer", transition: "all 0.6s ease",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(196,164,104,0.07)";
            e.currentTarget.style.borderColor = "#c4a468";
            e.currentTarget.style.letterSpacing = "0.55em";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "rgba(196,164,104,0.35)";
            e.currentTarget.style.letterSpacing = "0.45em";
          }}
        >
          Enter
        </button>
      </FadeUp>

      <div style={{
        position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{ height: 1, width: 32, background: "rgba(196,164,104,0.2)" }} />
        <div style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "rgba(196,164,104,0.35)" }} />
        <div style={{ height: 1, width: 32, background: "rgba(196,164,104,0.2)" }} />
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [phase, setPhase] = useState<"landing" | "transitioning" | "inner">("landing");
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio("/wedding-music.mp3");
    audio.loop = true;
    audio.volume = 0.35;
    audioRef.current = audio;
    return () => { audio.pause(); };
  }, []);

  const handleEnter = useCallback(() => {
    if (phase !== "landing") return;

    // Start music on Enter click (requires user gesture)
    if (audioRef.current) {
      audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => {});
    }

    setPhase("transitioning");
    setTimeout(() => setPhase("inner"), 1400);
  }, [phase]);

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (musicPlaying) { audio.pause(); setMusicPlaying(false); }
    else { audio.play().then(() => setMusicPlaying(true)).catch(() => {}); }
  };

  const curtainActive = phase === "transitioning";
  const showInner     = phase === "inner";

  return (
    <main style={{
      position: "relative", width: "100vw", height: "100vh",
      backgroundColor: "#0B0B0B", overflow: "hidden",
    }}>
      {/* Grain */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 100, pointerEvents: "none", opacity: 0.025,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundSize: "128px 128px",
      }} />

      <Curtain active={curtainActive} />

      {/* Landing */}
      <div style={{
        position: "absolute", inset: 0,
        opacity: showInner ? 0 : 1,
        pointerEvents: showInner ? "none" : "auto",
        transition: "opacity 0.4s ease",
      }}>
        <LandingScreen onEnter={handleEnter} />
      </div>

      {/* Inner */}
      <InnerSite visible={showInner} />

      {/* Music toggle — only visible after entering */}
      {showInner && <MusicPlayer playing={musicPlaying} onToggle={toggleMusic} />}
    </main>
  );
}