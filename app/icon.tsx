import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #3b5bdb 0%, #2f49b0 100%)",
        }}
      >
        <div
          style={{
            width: 210,
            height: 210,
            background: "white",
            borderRadius: 36,
            transform: "rotate(45deg)",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
