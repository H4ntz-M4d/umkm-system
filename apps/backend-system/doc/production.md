# Production API Spec

## Get All

Endpoint : GET /api/v1/production

Query Params :

- `skip` (optional) - jumlah data yang dilewati, default `0`
- `limit` (optional) - jumlah data per halaman, default `10`
- `search` (optional) - cari berdasarkan nama produk atau judul be-spoke
- `type` (optional) - filter tipe produksi, salah satu dari `RESTOCK`, `MADE_TO_ORDER`, `BE_SPOKE`, `PRE_ORDER`
- `status` (optional) - filter status produksi, salah satu dari `PLANNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`

Response Body (Success) :

```json
{
  "data": [
    {
      "id": "1",
      "storeId": "1",
      "producedVariantId": "3",
      "productName": "Sweater Rajut",
      "sku": "SW-001",
      "quantityProduced": 20,
      "type": "RESTOCK",
      "status": "PLANNED",
      "targetDate": "2026-08-01T00:00:00.000Z",
      "notes": "Restock untuk stok Lebaran",
      "createdAt": "2026-07-25T03:51:01.696Z",
      "bespoke": {
        "id": null,
        "title": null,
        "description": null,
        "quotedPrice": null,
        "customer": {
          "id": null,
          "name": null,
          "email": null,
          "phone": null
        }
      }
    }
  ]
}
```

## Get Summary

Endpoint : GET /api/v1/production/summary

Response Body (Success) :

```json
{
  "planned": 4,
  "inProgress": 2,
  "completed": 10,
  "cancelled": 1
}
```

## Get By Id

Endpoint : GET /api/v1/production/:id

Response Body (Success) :

```json
{
  "data": {
    "id": "1",
    "storeId": "1",
    "producedVariantId": "3",
    "quantityProduced": 20,
    "status": "PLANNED",
    "type": "RESTOCK",
    "createdAt": "2026-07-25T03:51:01.696Z"
  }
}
```

## Create

Endpoint : POST /api/v1/production

Request Body (tipe `RESTOCK`/`MADE_TO_ORDER`/`PRE_ORDER`) :

```json
{
  "storeId": 1,
  "producedVariantId": "3",
  "quantityProduced": 20,
  "type": "RESTOCK",
  "status": "PLANNED",
  "notes": "Restock untuk stok Lebaran",
  "targetDate": "2026-08-01"
}
```

Request Body (tipe `BE_SPOKE`, field `bespoke` wajib diisi) :

```json
{
  "storeId": 1,
  "quantityProduced": 1,
  "type": "BE_SPOKE",
  "status": "PLANNED",
  "targetDate": "2026-08-15",
  "bespoke": {
    "name": "Angga Saputra",
    "email": "angga@gmail.com",
    "phone": "081233112121",
    "title": "Jaket Rajut Custom",
    "description": "Ukuran L warna hitam",
    "quotedPrice": 350000
  }
}
```

Catatan :

- Status yang boleh dikirim saat create hanya `PLANNED`/`IN_PROGRESS` (`COMPLETED`/`CANCELLED` ditolak).
- Untuk tipe `BE_SPOKE`, sistem akan mencari `Customer` berdasarkan email, membuat baru jika belum ada, lalu membuat `BeSpokeDetails`.

Response Body (Success) :

```json
{
  "data": {
    "id": "1",
    "storeId": "1",
    "producedVariantId": null,
    "quantityProduced": 1,
    "status": "PLANNED",
    "type": "BE_SPOKE",
    "createdAt": "2026-07-25T03:51:01.696Z"
  }
}
```

## Update

Endpoint : PUT /api/v1/production/:id/edit

Request Body : sama seperti Create.

Response Body (Success) :

```json
{
  "data": {
    "id": "1",
    "storeId": "1",
    "producedVariantId": "3",
    "quantityProduced": 20,
    "status": "PLANNED",
    "type": "RESTOCK",
    "createdAt": "2026-07-25T03:51:01.696Z"
  }
}
```

## Update Status (Selain Completed)

Endpoint : PATCH /api/v1/production/:id/status-update

Request Body :

```json
{
  "status": "IN_PROGRESS"
}
```

Catatan : Status `COMPLETED` ditolak di endpoint ini, gunakan endpoint "Selesaikan Produksi" di bawah.

Response Body (Success) :

```json
{
  "data": {
    "id": "1",
    "storeId": "1",
    "producedVariantId": "3",
    "quantityProduced": 20,
    "status": "IN_PROGRESS",
    "type": "RESTOCK",
    "createdAt": "2026-07-25T03:51:01.696Z"
  }
}
```

## Selesaikan Produksi

Endpoint : POST /api/v1/production/:id/status-completed

Request Body :

```json
{
  "status": "COMPLETED"
}
```

Catatan :

- Ditolak jika status saat ini sudah `COMPLETED` atau `CANCELLED`.
- Menambah stok `ProductVariantStock` sejumlah `quantityProduced` dan mencatat `InventoryLedger` arah `IN` sumber `PRODUCTION`.
- Untuk tipe `BE_SPOKE`, juga mencatat `CashTransaction` bertipe `IN` sumber `PRODUCTION` sebesar `quotedPrice`.

Response Body (Success) : entity `Production` hasil update (raw Prisma record, belum melalui response mapper).

## Hapus

Endpoint : DELETE /api/v1/production/:id

Response Body (Success) :

```json
{
  "data": {
    "id": "1",
    "storeId": "1",
    "producedVariantId": "3",
    "quantityProduced": 20,
    "status": "PLANNED",
    "type": "RESTOCK",
    "createdAt": "2026-07-25T03:51:01.696Z"
  }
}
```
