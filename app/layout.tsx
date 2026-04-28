import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["600", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AutomatedIntake — Talk. Tap. Done.",
  description: "Turn any customer conversation into a work order in under 60 seconds.",
  applicationName: "AutomatedIntake",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AI Intake",
  },
  formatDetection: { telephone: false },
  icons: { apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#06D6A0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${barlow.variable} ${barlowCondensed.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="bottom-center" theme="dark" />
      </body>
    </html>
  );
}
