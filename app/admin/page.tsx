"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface RsvpEntry {
  id: string;
  name: string;
  count: number;
  event: string;
  created_at: string;
}

export default function AdminPage() {
  const [data, setData] = useState<RsvpEntry[]>([]);
  const [loading, setLoading] = useState(true);

const [authorized, setAuthorized] = useState(false); 
const [password, setPassword] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("rsvps")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) setData(data || []);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (!authorized) {
  return (
    <div style={{ padding: 40 }}>
      <input
        type="password"
        placeholder="Enter admin password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={() => {
          if (password === "15052000") setAuthorized(true);
        }}
      >
        Enter
      </button>
    </div>
  );
}

  const totalGuests = data.reduce((sum, r) => sum + r.count, 0);

  return (
    <main style={{
      minHeight: "100vh",
      background: "#0B0B0B",
      color: "#e8dfc8",
      padding: "40px 20px",
      fontFamily: "var(--font-cormorant),serif"
    }}>
      <h1 style={{ fontSize: "2rem", marginBottom: 20 }}>
        Admin Dashboard
      </h1>

      {/* Stats */}
      <div style={{ display: "flex", gap: 20, marginBottom: 30 }}>
        <div>
          <p>Total Guests</p>
          <h2>{totalGuests}</h2>
        </div>

        <div>
          <p>Total Families</p>
          <h2>{data.length}</h2>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #333" }}>
                <th>Name</th>
                <th>Guests</th>
                <th>Event</th>
                <th>Time</th>
              </tr>
            </thead>

            <tbody>
              {data.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #222" }}>
                  <td>{r.name}</td>
                  <td>{r.count}</td>
                  <td>{r.event}</td>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}