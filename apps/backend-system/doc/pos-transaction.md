# POS Transaction API Spec

## Get All

Endpoint : GET /api/v1/pos-transactions

Query Params :

- `skip` (optional) - jumlah data yang dilewati, default `0`
- `limit` (optional) - jumlah data per halaman, default `10`
- `search` (optional) - cari berdasarkan `transId` atau nama kasir
- `paymentChannel` (optional) - filter berdasarkan nama channel pembayaran
- `storeId` (optional) - filter berdasarkan toko
- `status` (optional) - filter status, salah satu dari `PENDING`, `PARKED`, `PAID`, `CANCELLED`
- `dateFrom` (optional) - filter tanggal mulai, format `YYYY-MM-DD`
- `dateTo` (optional) - filter tanggal akhir, format `YYYY-MM-DD`

Response Body (Success) :

```json
{
  "data": [
    {
      "id": "1",
      "transId": "POS-2026072500001",
      "storeId": "1",
      "storeName": "Nurfa Craft Jogja",
      "cashierName": "Rendy Setiawan",
      "paymentMethod": "Tunai",
      "totalAmount": "100000",
      "status": "PAID",
      "createdAt": "2026-07-25T03:51:01.696Z",
      "items": [
        {
          "productVariantId": "1",
          "quantity": 2,
          "price": "50000",
          "subtotal": "100000",
          "variant": "Sweater Rajut, Merah - Wol"
        }
      ]
    }
  ]
}
```

## Get Parked Transactions

Endpoint : GET /api/v1/pos-transactions/parked

Mengambil transaksi yang berstatus `PARKED` (transaksi yang ditunda/disimpan sementara di kasir).

Response Body (Success) :

```json
{
  "data": [
    {
      "transId": "POS-2026072500002",
      "status": "PARKED",
      "itemTransaction": [
        {
          "productVariantId": "1",
          "qty": 2,
          "price": "50000",
          "itemTransactionName": "Sweater Rajut",
          "itemTransactionVariantOpt": "Merah - Wol"
        }
      ]
    }
  ]
}
```

## Cek Status Transaksi

Endpoint : GET /api/v1/pos-transactions/:id/check-status

Response Body (Success) :

```json
{
  "status": "PAID"
}
```

## Create / Update (Upsert)

Endpoint : POST /api/v1/pos-transactions

Request Body :

```json
{
  "transId": null,
  "storeId": "1",
  "cashierId": "1",
  "paymentMethodId": "2",
  "status": "PENDING",
  "itemTransaction": [
    {
      "productVariantId": "1",
      "quantity": 2,
      "price": 50000
    }
  ]
}
```

Catatan :

- Jika `transId` bernilai `null`, sistem akan membuat transaksi baru (`transId` di-generate otomatis dengan prefix `POS`). Jika `transId` diisi, sistem akan meng-update transaksi yang sudah ada (item lama yang tidak dikirim ulang akan dihapus, item baru ditambahkan, item yang sama diperbarui).
- Jika `paymentMethodId` merujuk pada channel `MIDTRANS`, response akan menyertakan `qrString` dan `qrUrl` untuk pembayaran QRIS.
- Jika `status` dikirim `PAID` (bukan lewat Midtrans), stok akan langsung dikurangi, dicatat di `InventoryLedger` (arah `OUT`, sumber `POS`), dan dicatat `CashTransaction` (`OUT`, sumber `EXPENSE`).
- Setiap item akan divalidasi terhadap stok yang tersedia, request ditolak jika stok tidak cukup.

Response Body (Success, tanpa Midtrans) :

```json
{
  "id": "1",
  "transId": "POS-2026072500001",
  "storeId": "1",
  "cashierId": "1",
  "paymentMethodId": "2",
  "totalAmount": "100000",
  "status": "PENDING",
  "createdAt": "2026-07-25T03:51:01.696Z"
}
```

Response Body (Success, dengan Midtrans/QRIS) :

```json
{
  "id": "1",
  "transId": "POS-2026072500001",
  "storeId": "1",
  "cashierId": "1",
  "paymentMethodId": "3",
  "totalAmount": "100000",
  "status": "PENDING",
  "createdAt": "2026-07-25T03:51:01.696Z",
  "qrString": "00020101...",
  "qrUrl": "https://api.midtrans.com/v2/qris/.../qr-code"
}
```

## Upload Bukti Pembayaran

Endpoint : POST /api/v1/pos-transactions/:id/upload-paymentProof

Content-Type : `multipart/form-data`

Request Body :

- `paymentProof` - file bukti transfer

Catatan : Setelah bukti diupload, transaksi otomatis diubah menjadi status `PAID` beserta efek stok dan pencatatan kas seperti pada Create/Update.

Response Body (Success) : entity `PosTransaction` dengan status `PAID`.

## Webhook Midtrans

Endpoint : POST /api/v1/pos-transactions/webhook/midtrans

Dipanggil oleh Midtrans, bukan oleh frontend. Memverifikasi signature, lalu mengubah transaksi menjadi `PAID` jika `transaction_status` berupa `settlement` atau `capture`.

Response Body (Success) :

```json
{
  "received": true
}
```

## Selesaikan Transaksi

Endpoint : PATCH /api/v1/pos-transactions/completed-transaction

Mengubah status transaksi menjadi `PAID` secara manual.

> Catatan implementasi : endpoint ini membaca id transaksi dari `@Param('id')`, namun path saat ini tidak memiliki segmen `:id` (`/completed-transaction`) sehingga `transPosId` selalu kosong saat dipanggil. Perlu diperbaiki menjadi `/completed-transaction/:id` agar berfungsi sebagaimana mestinya.

## Batalkan Transaksi

Endpoint : PATCH /api/v1/pos-transactions/cancelled

Request Body :

```json
["POS-2026072500001", "POS-2026072500002"]
```

Mengubah status seluruh `transId` yang dikirim menjadi `CANCELLED`.

Response Body (Success) :

```json
{
  "count": 2
}
```
