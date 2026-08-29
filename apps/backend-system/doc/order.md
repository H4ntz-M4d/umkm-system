# Order API Spec

## Get All

Endpoint : GET /api/v1/orders

Query Params :

- `skip` (optional) - jumlah data yang dilewati, default `0`
- `limit` (optional) - jumlah data per halaman, default `10`
- `store` (optional) - filter berdasarkan `storeId`
- `status` (optional) - filter berdasarkan status order, salah satu dari `PENDING`, `PAID`, `CANCELLED`
- `search` (optional) - cari berdasarkan `orderId` atau nama pelanggan

Response Body (Success) :

```json
{
  "data": [
    {
      "storeId": "1",
      "storeName": "Nurfa Craft Jogja",
      "customerName": "Rendy Setiawan",
      "orderId": "ORDER-2026728",
      "paymentMethodName": "BRI",
      "status": "PENDING",
      "totalAmount": "100000",
      "createdAt": "2026-07-25T03:51:01.696Z",
      "items": [
        {
          "id": "1",
          "productName": "Sweater Rajut - Merah - Wol",
          "quantity": "2",
          "price": "50000",
          "subtotal": "100000"
        }
      ],
      "shipment": {
        "id": "1",
        "recipientName": "Angga Saputra",
        "phone": "081233112121",
        "addressLine": "Jl. Jendral Sudirman No. 123",
        "city": "Malang",
        "province": "Jawa Timur",
        "courier": "J&T",
        "shippingCost": "20000",
        "createdAt": "2026-07-25T03:51:01.696Z",
      }
    }
  ]
}
```

## Perbarui Pengiriman

> Membutuhkan autentikasi (role: `OWNER`, `ADMIN`, `GUDANG`).

Endpoint : PATCH /api/v1/orders/:orderId/shipment

Pengiriman ditangani **manual** — belum ada integrasi kurir seperti RajaOngkir — jadi admin/gudang menandai sendiri status dan mengetik nomor resinya.

Request Body :

```json
{
  "status": "SHIPPED",
  "trackingNumber": "JP1234567890"
}
```

`status` salah satu dari `PACKAGING` | `SHIPPED` | `DELIVERED` | `CANCELLED`. `trackingNumber` opsional (boleh `null`).

**Status pesanan ikut diselaraskan:**

| Status pengiriman | Status pesanan |
|---|---|
| `SHIPPED` | menjadi `SHIPPED` |
| `DELIVERED` | menjadi `COMPLETED` |
| `PACKAGING`, `CANCELLED` | **tidak diubah** |

`PACKAGING` dan `CANCELLED` sengaja tidak menggeser status pesanan: paket yang batal dikirim belum tentu pesanannya batal — bisa jadi hanya dikirim ulang — dan pembatalan pesanan punya alurnya sendiri lewat `PATCH /api/v1/orders/cancelled`.

Response Body (Success) :

```json
{
  "success": true,
  "data": {
    "orderId": "ORDER-20260727-A3F9",
    "shipmentStatus": "SHIPPED",
    "trackingNumber": "JP1234567890",
    "orderStatus": "SHIPPED"
  }
}
```

Response Body (Failed) :

```json
{
  "success": false,
  "error": { "code": "HTTP_ERROR", "message": "Pesanan belum dibayar, pengiriman belum bisa diproses" }
}
```

Pesan galat lain: `Pesanan tidak ditemukan`, `Pesanan ini tidak memiliki data pengiriman`, `Pesanan sudah dibatalkan`.

## Batalkan Order

Endpoint : PATCH /api/v1/orders/cancelled

Mengubah status seluruh `orderId` yang dikirim menjadi `CANCELLED`. Mengikuti pola yang sama seperti `PATCH /api/v1/pos-transactions/cancelled`.

Request Body :

```json
["ORDER-2026728", "ORDER-2026729"]
```

Response Body (Success) :

```json
{
  "count": 2
}
```

---

# Order — Sisi Customer

> Membutuhkan autentikasi (role: `CUSTOMER`), kecuali webhook.

## Checkout

Endpoint : POST /api/v1/orders/checkout

Mengubah isi keranjang menjadi `Order` berstatus `PENDING`, lalu menerbitkan token Midtrans Snap.

**Isi keranjang tidak dikirim dari client.** Server membacanya sendiri dari `CartItem`, dan harga diambil dari `ProductVariant.price` — supaya jumlah maupun harga tidak bisa dimanipulasi. Ongkir saat ini dipaksa `0` di server (`SHIPPING_COST`).

Alamat wajib diisi lewat salah satu cara: `addressId` (dari buku alamat) **atau** `shipment` (diketik langsung).

Request Body :

```json
{
  "addressId": "1",
  "courier": "J&T",
  "saveAddress": false
}
```

atau

```json
{
  "shipment": {
    "recipientName": "Angga Saputra",
    "phone": "081233112121",
    "addressLine": "Jl. Jendral Sudirman No. 123",
    "city": "Malang",
    "province": "Jawa Timur"
  },
  "courier": "J&T",
  "saveAddress": true
}
```

Response Body (Success) :

```json
{
  "success": true,
  "data": {
    "orderId": "ORDER-20260727-A3F9",
    "snapToken": "66e4fa55-fdac-4ef9-91b5-733b97d1b862",
    "redirectUrl": "https://app.sandbox.midtrans.com/snap/v3/redirection/66e4fa55-...",
    "totalAmount": "150000"
  }
}
```

Response Body (Failed) :

```json
{
  "success": false,
  "error": { "code": "HTTP_ERROR", "message": "Keranjang kosong, tidak bisa melakukan checkout" }
}
```

Kemungkinan pesan galat lain: `Maaf stock dari <produk> variant <varian> tidak mencukupi`, `Alamat tidak ditemukan`, `Belum ada toko aktif. Hubungi admin untuk mengaktifkan toko.`, `Metode pembayaran Midtrans belum tersedia. Hubungi admin.`

> **Prasyarat data:** harus ada minimal satu `Store` dengan `isActive: true` dan satu `PaymentMethod` aktif dengan `channel: MIDTRANS`. Tanpa keduanya checkout selalu gagal, karena `Order.storeId` dan `Order.paymentMethodId` tidak boleh kosong.

Urutan kerjanya: order dibuat dalam satu transaksi → token Snap diminta **di luar** transaksi → bila berhasil, `paymentGatewayRef` diisi dan keranjang dikosongkan; bila gagal, order langsung di-`CANCELLED` dan keranjang **tidak** dikosongkan.

## Riwayat Pesanan

Endpoint : GET /api/v1/orders/me

Query Params :

- `skip`, `limit` (optional)
- `status` (optional) - `PENDING` | `PAID` | `CANCELLED` | `SHIPPED` | `COMPLETED` | `REFUNDED`

Hanya mengembalikan pesanan milik customer yang sedang login.

Response Body (Success) :

```json
{
  "success": true,
  "data": [
    {
      "orderId": "ORDER-20260727-A3F9",
      "status": "PENDING",
      "totalAmount": "150000",
      "createdAt": "2026-07-27T03:51:01.696Z",
      "paymentMethodName": "Midtrans",
      "snapToken": "66e4fa55-fdac-4ef9-91b5-733b97d1b862",
      "totalItems": 3,
      "items": [
        {
          "id": "1",
          "productName": "Syal Lembut Wol",
          "slug": "syal-lembut-wol",
          "image": "https://res.cloudinary.com/.../merah.jpg",
          "options": { "Warna": "Merah" },
          "quantity": 2,
          "price": "50000",
          "subtotal": "100000"
        }
      ],
      "shipment": {
        "id": "1",
        "recipientName": "Angga Saputra",
        "phone": "081233112121",
        "addressLine": "Jl. Jendral Sudirman No. 123",
        "city": "Malang",
        "province": "Jawa Timur",
        "courier": "J&T",
        "shippingCost": "0",
        "createdAt": "2026-07-27T03:51:01.696Z"
      }
    }
  ],
  "meta": { "skip": 0, "limit": 10, "total": 1, "timeStamp": "..." }
}
```

`snapToken` hanya terisi selama status masih `PENDING`, supaya pembayaran yang belum selesai bisa dilanjutkan.

## Detail Pesanan

Endpoint : GET /api/v1/orders/me/:orderId

`:orderId` adalah nomor order (`ORDER-...`), bukan id numerik. Query-nya menyertakan `customerId`, jadi pesanan milik orang lain tidak bisa dibuka dengan menebak nomor.

Response Body (Failed) :

```json
{
  "success": false,
  "error": { "code": "HTTP_ERROR", "message": "Pesanan tidak ditemukan" }
}
```

## Selaraskan Status Pembayaran

Endpoint : POST /api/v1/orders/me/:orderId/sync

Menanyakan status sebenarnya ke Midtrans (`GET /v2/{order_id}/status`) lalu menerapkannya lewat jalur yang sama persis dengan webhook.

**Kenapa perlu.** Notifikasi webhook bisa tidak pernah sampai — URL salah di dashboard, server sedang mati, atau jaringan putus — dan pesanan akan menggantung `PENDING` padahal pembeli sudah membayar. Midtrans **tidak** menyediakan API untuk meminta notifikasi dikirim ulang, jadi satu-satunya jalan yang bisa kita kendalikan adalah menarik statusnya sendiri.

Halaman `/orders/[orderId]` memanggil endpoint ini otomatis selama status masih `PENDING` (lihat `OrderStatusPoller`), jadi pesanan yang nyangkut sembuh sendiri begitu pembeli membukanya.

Response Body (Success) :

```json
{
  "success": true,
  "data": {
    "orderId": "ORDER-20260727-A3F9",
    "status": "PAID",
    "changed": true
  }
}
```

- `changed: false` berarti tidak ada yang berubah — entah statusnya memang sudah final, atau transaksinya belum ada di Midtrans (pembeli belum membuka halaman pembayaran).
- Idempoten: order yang sudah `PAID` tidak diproses ulang, jadi stok dan kas tidak pernah tercatat dua kali.

## Webhook Midtrans

Endpoint yang **didaftarkan di dashboard** : POST /api/v1/webhooks/midtrans

> Dashboard Midtrans hanya menyediakan **satu** field Payment Notification URL, dan versi SDK yang dipakai tidak bisa menyisipkan header `X-Override-Notification` per transaksi. Karena itu semua notifikasi ditampung di satu endpoint, lalu disalurkan berdasarkan awalan `order_id` yang dibentuk `idFormat()`:
>
> | Awalan | Disalurkan ke |
> |---|---|
> | `ORDER-` | `CustomerOrderService.handleMidtransWebHook` |
> | `POS-` | `PosTransactionService.handleMidtransWebHook` |
> | selain itu | diabaikan, dibalas `200` |
>
> Verifikasi tanda tangan tetap dilakukan di masing-masing service, bukan di dispatcher — jadi tidak ada jalur yang lolos tanpa diperiksa.

Endpoint lama `POST /api/v1/orders/webhook/midtrans` dan `POST /api/v1/pos-transactions/webhook/midtrans` **masih hidup** sebagai jaring pengaman selama masa peralihan, dan boleh dihapus setelah dashboard dipastikan mengarah ke URL gabungan.

**Publik** — dipanggil Midtrans tanpa sesi, keasliannya diverifikasi lewat tanda tangan SHA-512.

Perilakunya:

| `transaction_status` | Tindakan |
|---|---|
| `settlement`, atau `capture` dengan `fraud_status: accept` | Order → `PAID`, lalu catat `InventoryLedger` (`ONLINE_ORDER`/`OUT`), `CashTransaction` (`IN`/`ORDER`), dan kurangi stok |
| `expire`, `cancel`, `deny`, `failure` | Order `PENDING` → `CANCELLED` |
| lainnya | diabaikan |

**Idempoten**: notifikasi ulang untuk order yang sudah `PAID` langsung diabaikan, jadi stok dan kas tidak tercatat dua kali. Nomor order yang tidak dikenal tetap dibalas `200` agar Midtrans berhenti mengulang.

Setelan di dashboard Midtrans Sandbox → *Payment Notification URL*: `<url-publik>/api/v1/webhooks/midtrans`
