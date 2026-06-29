import { ImageResponse } from "next/og";

// Image de partage (Open Graph + Twitter) PrediScore.

export const alt = "PrediScore — L'IA qui décrypte chaque match de foot.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const EMERALD = "#2fc58f";
const BG = "#061316";
const MUTED = "#a8c2bd";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "96px",
          backgroundColor: BG,
          backgroundImage: `radial-gradient(900px 500px at 18% 0%, rgba(47,197,143,0.22), transparent 60%), radial-gradient(800px 420px at 84% 22%, rgba(44,198,200,0.16), transparent 62%)`,
          color: "#F2FBF6",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            color: EMERALD,
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 999,
              backgroundColor: EMERALD,
              display: "flex",
            }}
          />
          PrediScore.fr
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 150,
            fontWeight: 800,
            letterSpacing: "0",
            lineHeight: 1,
          }}
        >
          <span>Vision</span>
          <span style={{ color: EMERALD }}>11</span>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 36,
            fontSize: 46,
            fontWeight: 600,
            color: "#F2FBF6",
            maxWidth: 900,
          }}
        >
          Analyse chaque match avant le coup d'envoi.
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 20,
            fontSize: 30,
            color: MUTED,
            maxWidth: 940,
          }}
        >
          Probabilités, scénario IA, confiance transparente et +200 compétitions.
        </div>
      </div>
    ),
    { ...size },
  );
}
