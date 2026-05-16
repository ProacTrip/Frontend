# frontend-v2 — ProacTrip Next.js 16 + Bun + Tailwind v4
FROM oven/bun:1-alpine

WORKDIR /app

# Instalar dependencias (incluye devDependencies donde está @tailwindcss/postcss)
COPY package.json bun.lock ./
RUN bun install

# Copiar el resto del código
COPY . .

EXPOSE 3000

# Modo desarrollo con Turbopack
CMD ["bun", "--bun", "run", "dev"]
