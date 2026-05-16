# frontend-v2 — ProacTrip Next.js 16 + Tailwind v4 + Turbopack
# Usamos Debian (no Alpine) porque @tailwindcss/oxide necesita glibc
FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

EXPOSE 3000
CMD ["bun", "--bun", "run", "dev"]
