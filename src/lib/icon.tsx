import { ImageResponse } from "next/og";

// A moon on a night-sky background. The moon is kept small so the icon also works as a "maskable" icon.
export function moonIcon(size: number) {
  const moon = Math.round(size * 0.5);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 50% 20%, #2a1f78 0%, #0b0c24 60%, #070815 100%)",
        }}
      >
        <div
          style={{
            width: moon,
            height: moon,
            borderRadius: 9999,
            background: "radial-gradient(circle at 35% 30%, #fffbea, #ebe0bd 55%, #b8ac86)",
            boxShadow: `0 0 ${Math.round(size * 0.12)}px rgba(239,230,207,0.55)`,
          }}
        />
      </div>
    ),
    { width: size, height: size }
  );
}
