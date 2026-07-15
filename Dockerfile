# =====================================
# DOCKERFILE UNTUK FLIGHT BOOKING BAZMA
# (Versi Simple - 1 Stage Aja)
# =====================================

# Kita pake Node.js versi 20 (Alpine biar kecil ukurannya)
FROM node:20-alpine

# Set folder kerja di dalam container
WORKDIR /app

# Install OpenSSL (dibutuhkan Prisma)
RUN apk add --no-cache openssl

# 1. Copy file package.json dan package-lock.json dulu
COPY package.json package-lock.json ./

# 2. Install semua dependencies (npm ci lebih cepet dari npm install)
RUN npm ci

# 3. Copy Prisma schema dan generate client
COPY prisma ./prisma
RUN npx prisma generate

# 4. Copy semua file project
COPY . .

# 5. Copy .env.example jadi .env (bisa di-overwrite pas jalanin container)
COPY .env.example .env

# 6. Build project Next.js
RUN npm run build

# 7. Port yang dipake aplikasi
EXPOSE 3000

# 8. Perintah jalanin app: migrasi dulu, baru start
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed --skip-generate || true && node server.js"]