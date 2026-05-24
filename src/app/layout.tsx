import "./globals.css";
import type { Metadata } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import { cookies } from "next/headers";
import { Providers } from "./providers";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "ProacTrip",
  description: "ProacTrip — Tu portal de viajes y aventuras",
  icons: {
    icon: "/logo.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const serverAuthenticated =
    cookieStore.has("__Secure-access_token") ||
    cookieStore.has("__Secure-refresh_token") ||
    cookieStore.has("access_token") ||
    cookieStore.has("refresh_token");

  return (
    <html lang="es">
      <body
        className={`${dmSans.variable} ${outfit.variable} font-sans antialiased`}
      >
        <Providers serverAuthenticated={serverAuthenticated}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
