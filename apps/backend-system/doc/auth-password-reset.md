# Lupa / Ganti Kata Sandi API Spec

Alur tiga langkah, **publik** (tanpa autentikasi) — justru dipakai pengguna yang
tidak bisa masuk. Dipakai bersama admin dan customer karena keduanya berbagi
tabel `Users`.

```
POST /forgot-password    -> kode 6 digit dikirim ke email
POST /verify-reset-code  -> memastikan kode benar sebelum form kata sandi tampil
POST /reset-password     -> kode diperiksa ulang, kata sandi diganti
```

## Keamanan

| Aspek | Perlakuan |
|---|---|
| Penyimpanan kode | Di-hash bcrypt di tabel `password_reset_code`, tidak pernah disimpan polos |
| Masa berlaku | 10 menit |
| Sekali pakai | Ditandai `usedAt` setelah kata sandi diganti |
| Batas salah tebak | 5 kali; lewat itu kode hangus dan harus minta ulang |
| Kode ganda | Permintaan baru membatalkan kode lama, jadi hanya ada satu kode hidup |
| Sesi lama | `refreshToken` di-null-kan setelah ganti kata sandi, perangkat lain terputus |
| Sumber acak | `crypto.randomInt`, bukan `Math.random` |

> Email yang tidak terdaftar dibalas **404 "Email tidak terdaftar"** — sesuai
> permintaan agar pengguna tahu kalau salah ketik. Konsekuensinya orang luar bisa
> menebak email mana yang terdaftar. Kalau nanti ingin ditutup, balas sukses untuk
> semua email dan diam-diam tidak mengirim apa pun.

## 1. Minta Kode

Endpoint : POST /api/auth/forgot-password

```json
{ "email": "nurkayekti@gmail.com" }
```

Response Body (Success) :

```json
{
  "success": true,
  "data": {
    "message": "Kode verifikasi telah dikirim ke email Anda",
    "maskedEmail": "nu********@gmail.com",
    "expiresInMinutes": 10
  }
}
```

Galat: `Email tidak terdaftar` (404), `Akun ini sedang tidak aktif` (400).

## 2. Verifikasi Kode

Endpoint : POST /api/auth/verify-reset-code

```json
{ "email": "nurkayekti@gmail.com", "code": "123456" }
```

Response Body (Success) : `{ "valid": true, "message": "Kode verifikasi benar" }`

Galat: `Kode verifikasi salah. Sisa percobaan: N`, atau
`Kode verifikasi tidak ditemukan atau sudah kedaluwarsa. Silakan minta kode baru.`

Langkah ini **tidak** menghanguskan kode — hanya memeriksa, supaya form kata
sandi baru bisa ditampilkan.

## 3. Ganti Kata Sandi

Endpoint : POST /api/auth/reset-password

```json
{
  "email": "nurkayekti@gmail.com",
  "code": "123456",
  "password": "rahasiaBaru1",
  "confirmPassword": "rahasiaBaru1"
}
```

Kode **diperiksa ulang** di sini, tidak mengandalkan hasil langkah 2 — kalau
tidak, endpoint ini bisa dipanggil langsung tanpa pernah punya kode yang benar.

## Konfigurasi Email

Diatur lewat env di `apps/backend-system/.env`:

```
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="alamat@gmail.com"
SMTP_PASS="app-password-16-karakter"
SMTP_FROM="Nurfa Craft <no-reply@nurfacraft.com>"
```

Gmail memerlukan **App Password** (bukan kata sandi akun) dan 2FA harus aktif
lebih dulu.

**Kalau `SMTP_USER`/`SMTP_PASS` kosong**, email tidak dikirim sungguhan melainkan
isinya dicetak ke log backend. Seluruh alur tetap berjalan, jadi bisa diuji tanpa
kredensial. Kegagalan kirim juga tidak menggagalkan permintaan — kodenya sudah
terlanjur tersimpan, dan galatnya dicatat di log.
