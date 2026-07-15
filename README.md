# Maskapai

Aplikasi flight booking berbasis Next.js, Prisma, PostgreSQL, Nginx, dan Docker Compose.

Deployment Ubuntu VM **tidak memakai `deploy.sh` atau script deploy**. Semua langkah memakai perintah Docker Compose standar.

## Arsitektur Docker

```text
Browser
   |
   v
Ubuntu VM :8080
   |
   v
Nginx loadbalancer
   |  least_conn
   +----------+----------+
   |          |          |
   v          v          v
 web1       web2       web3
   \          |          /
    \         |         /
     +--------+--------+
              |
              v
 PostgreSQL 16
 service: database
 port internal: 5432
 volume: maskapai_postgres
```

Hanya Nginx yang membuka port host `8080`. `web1`, `web2`, `web3`, dan PostgreSQL hanya berada di network internal `maskapai_internal`.

## PostgreSQL di Docker

Tidak perlu menjalankan:

```bash
sudo apt install postgresql
```

PostgreSQL dijalankan oleh image:

```text
postgres:16-alpine
```

Compose memakai service database bernama:

```text
database
```

Karena itu koneksi aplikasi di dalam container harus memakai:

```text
postgresql://postgres:postgres@database:5432/maskapai?schema=public
```

Jangan memakai `localhost` untuk koneksi dari container web ke PostgreSQL. Di dalam container, `localhost` berarti container web itu sendiri.

Data PostgreSQL disimpan di named volume:

```text
maskapai_postgres
```

Jadi `docker compose down` tidak menghapus database.

## First Deploy ke Ubuntu VM

### 1. Masuk ke project

```bash
cd ~/maskapai
```

### 2. Buat file environment

```bash
cp .env.example .env
```

```bash
nano .env
```

Untuk sandbox, bagian PostgreSQL dapat memakai:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=maskapai
DATABASE_URL="postgresql://postgres:postgres@database:5432/maskapai?schema=public"
```

Ubah URL aplikasi sesuai IP VM:

```env
NEXT_PUBLIC_APP_URL=http://IP_VM_KAMU:8080
```

Isi juga reCAPTCHA, JWT, SMTP, dan Midtrans.

### 3. Validasi Docker Compose

```bash
docker compose config --quiet
```

Kalau command ini tidak menampilkan error, konfigurasi Compose berhasil diparse.

### 4. Build image

```bash
docker compose build --pull
```

Nilai `NEXT_PUBLIC_*` masuk saat proses `next build`. Setelah mengubah `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`, atau `NEXT_PUBLIC_APP_URL`, jalankan build ulang.

### 5. Jalankan seluruh service

```bash
docker compose up -d --wait --wait-timeout 300
```

Urutan startup Compose:

1. `database` menjalankan PostgreSQL 16.
2. Compose menunggu PostgreSQL healthy dengan `pg_isready`.
3. `migrate` menjalankan `npx prisma migrate deploy` satu kali.
4. `web1`, `web2`, dan `web3` start setelah migration selesai sukses.
5. Setiap web node mengecek `/api/health`, termasuk koneksi ke PostgreSQL.
6. `loadbalancer` start setelah tiga web node healthy.

### 6. Cek container

```bash
docker compose ps
```

Target status:

```text
maskapai-database       healthy
maskapai-migrate        exited (0)
maskapai-web1           healthy
maskapai-web2           healthy
maskapai-web3           healthy
maskapai-loadbalancer   healthy
```

`migrate` dengan status `Exited (0)` adalah normal karena service tersebut hanya menjalankan migration satu kali.

### 7. Tes load balancer

```bash
curl http://127.0.0.1:8080/lb-health
```

Output:

```text
ok
```

Tes aplikasi dan PostgreSQL:

```bash
curl http://127.0.0.1:8080/api/health
```

Contoh response:

```json
{
  "status": "ok",
  "service": "maskapai-web",
  "node": "web1",
  "database": "up"
}
```

Akses aplikasi dari browser:

```text
http://IP_VM_KAMU:8080
```

## Seed Data Demo

Seed **tidak dijalankan otomatis saat startup** karena seed project menghapus dan membuat ulang data penerbangan demo.

Untuk database sandbox yang memang ingin diisi data demo:

```bash
docker compose run --rm migrate npm run seed
```

Setelah seed:

```bash
docker compose restart web1 web2 web3
```

Jangan menjalankan seed setiap deploy pada database yang datanya ingin dipertahankan.

## Masuk ke PostgreSQL

Buka `psql` di container database:

```bash
docker compose exec database sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

Di dalam `psql`, lihat tabel:

```text
\dt
```

Lihat daftar database:

```text
\l
```

Keluar:

```text
\q
```

## Log dan Troubleshooting

### Semua log

```bash
docker compose logs --tail=200
```

### PostgreSQL

```bash
docker compose logs -f database
```

### Prisma migration

```bash
docker compose logs --tail=200 migrate
```

### Next.js

```bash
docker compose logs -f web1 web2 web3
```

### Nginx load balancer

```bash
docker compose logs -f loadbalancer
```

### Server 500

Lihat log tiga web node:

```bash
docker compose logs --tail=200 web1 web2 web3
```

Lalu cek health database:

```bash
curl -i http://127.0.0.1:8080/api/health
```

Cek migration:

```bash
docker compose logs --tail=200 migrate
```

## PostgreSQL ENV Berubah tetapi Password Lama Masih Dipakai

`POSTGRES_USER`, `POSTGRES_PASSWORD`, dan `POSTGRES_DB` dipakai PostgreSQL untuk inisialisasi ketika data directory masih kosong.

Kalau volume `maskapai_postgres` sudah pernah dibuat, mengubah `.env` tidak otomatis mengubah user atau password database lama.

Untuk **sandbox yang boleh direset total**:

```bash
docker compose down -v
```

Kemudian:

```bash
docker compose build --pull
```

```bash
docker compose up -d --wait --wait-timeout 300
```

Peringatan: `docker compose down -v` menghapus volume PostgreSQL dan seluruh data database di dalamnya.

## Update Deployment

```bash
git pull
```

```bash
docker compose config --quiet
```

```bash
docker compose build --pull
```

```bash
docker compose up -d --wait --wait-timeout 300 --remove-orphans
```

```bash
docker compose ps
```

Tidak ada script deploy. Flow deployment tetap menggunakan Docker Compose secara manual.

## Stop Service

Stop tanpa menghapus database:

```bash
docker compose down
```

Restart web dan load balancer:

```bash
docker compose restart web1 web2 web3 loadbalancer
```
