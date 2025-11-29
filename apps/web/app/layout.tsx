import type { ReactNode } from "react";

export const metadata = {
  title: "Horizon Demo",
  description: "Prediction market demo"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          background: "radial-gradient(circle at top, #0f172a 0, #020617 50%, #000 100%)",
          color: "white",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {children}
      </body>
    </html>
  );
}


