import { ImageResponse } from "next/og";

export const alt = "Loan Lab by Cense: find the student loan repayment plan that fits you";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The share card: the question the quiz answers, on Cense cream.
export default function OpengraphImage() {
  const lanes = [
    { label: "Standard", years: 10 },
    { label: "IBR", years: 20 },
    { label: "RAP", years: 30 },
  ];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#FFFCEC",
          color: "#275B2D",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>Cense / Loan Lab</div>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, maxWidth: 900 }}>
          Which student loan plan fits you?
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {lanes.map((l, i) => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ display: "flex", width: 150, fontSize: 28, fontWeight: 600 }}>{l.label}</div>
              <div
                style={{
                  display: "flex",
                  height: 22,
                  width: l.years * 28,
                  borderRadius: 999,
                  background: i === 2 ? "#26602D" : "#A9C3AA",
                }}
              />
              <div style={{ display: "flex", fontSize: 26 }}>{l.years} years</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
