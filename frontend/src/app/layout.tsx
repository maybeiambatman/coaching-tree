import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coaching Trees | Explore Sports Coaching Lineages",
  description: "Visualize coaching trees across NFL, NBA, and Soccer. Discover the lineages, mentorships, and influence of the greatest coaches in sports history.",
  keywords: ["coaching tree", "NFL coaches", "NBA coaches", "soccer managers", "coaching influence", "sports coaching"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-gray-900 text-white font-sans">
        {children}
      </body>
    </html>
  );
}
