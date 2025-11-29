import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Horizon",
  description: "USDC-native prediction markets on Sonic"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}

