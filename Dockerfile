# frontend-v2 — ProacTrip Next.js 16 + Tailwind v4 + Turbopack
FROM oven/bun:1

WORKDIR /app

# Solo copiar archivos — las dependencias se instalan en el entrypoint
COPY . .

EXPOSE 3000
