import { Playfair_Display, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["300", "400"],
  style: ["normal", "italic"],
});

export const metadata = {
  title: "Jovial & Anoopa",
  description: "June 29, 2026",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
      return (
    <html lang="en">
      <body className={`${playfair.variable} ${cormorant.variable}`}>
        {children}
      </body>
    </html>
  );
}