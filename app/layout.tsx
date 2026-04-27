import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";

//Configura la fuente principal (Geist Sans).
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"], // Descarga solo los caracteres latinos (optimización)
});

//Configura la fuente monoespaciada (tipo código).
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// === METADATA ===
// Esto controla lo que sale en la pestaña del navegador y en Google (SEO).
export const metadata: Metadata = {
  title: "ProacTrip", 
  description: "ProacTrip - Tu portal de viajes y aventuras", 
  icons: {
    icon: "/logo.ico", 
  },
};

//COMPONENTE PRINCIPAL DEL LAYOUT
// Providers es client component que wrappea AuthContext (necesario en Next.js 16 server layout)
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Define que el idioma de la web es español
    <html lang="es">
      {/* El cuerpo de la web. Aquí inyectamos las variables de las fuentes para usarlas */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* AuthProvider + cualquier provider futuro */}
        <Providers>
          {/* AQUÍ es donde Next.js "pega" el contenido de tu page.tsx actual */}
          {children}
        </Providers>
      </body>
    </html>
  );
}