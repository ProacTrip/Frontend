import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
      };
    }
    
    // AÑADE ESTO: Configuración para que Docker detecte cambios
    config.watchOptions = {
      poll: 1000,          // Revisa si hay cambios cada segundo
      aggregateTimeout: 300, // Da un pequeño margen antes de recargar
    };

    return config;
  },
};

export default nextConfig;