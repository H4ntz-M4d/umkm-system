# Products API Spec

## Get All

> Membutuhkan autentikasi (role: `OWNER`, `ADMIN`).

Endpoint : GET /api/v1/products

Query Params :

- `skip` (optional) - jumlah data yang dilewati, default `0`
- `limit` (optional) - jumlah data per halaman, default `10`
- `search` (optional) - cari berdasarkan nama produk

Response Body (Success) :

```json
{
  "data": [
    {
      "id": "1",
      "name": "Sweater Rajut",
      "description": "Sweater rajut bahan wol premium",
      "type": "READY_STOCK",
      "categoryId": "1",
      "status": "ACTIVE",
      "slug": "sweater-rajut",
      "useVariant": true,
      "createdAt": "2026-07-25T03:51:01.696Z",
      "variants": [
        {
          "id": "1",
          "sku": "SW-001",
          "price": "150000",
          "cost": "90000",
          "image": "https://res.cloudinary.com/.../variant.jpg",
          "productVariantStocks": 25
        }
      ]
    }
  ]
}
```

## Get Variant List (Simple)

> Membutuhkan autentikasi (role: `OWNER`, `ADMIN`).

Endpoint : GET /api/v1/products/list

Mengambil seluruh produk beserta id dan sku variant-nya saja, dipakai untuk dropdown/select (contoh: pemilihan `producedVariantId` pada form produksi).

Response Body (Success) :

```json
{
  "data": [
    {
      "id": "1",
      "name": "Sweater Rajut",
      "variants": [
        {
          "id": "1",
          "sku": "SW-001"
        }
      ]
    }
  ]
}
```

## Get By Id (Detail)

> Membutuhkan autentikasi (role: `OWNER`, `ADMIN`).

Endpoint : GET /api/v1/products/:id/details

Response Body (Success) :

```json
{
  "data": {
    "name": "Sweater Rajut",
    "description": "Sweater rajut bahan wol premium",
    "useVariant": true,
    "categoryId": "1",
    "type": "READY_STOCK",
    "status": "ACTIVE",
    "variants": [
      {
        "id": "1",
        "sku": "SW-001",
        "price": "150000",
        "cost": "90000",
        "image": "https://res.cloudinary.com/.../variant.jpg",
        "options": {
          "Warna": "Merah",
          "Bahan": "Wol"
        }
      }
    ],
    "variantTypes": [
      {
        "id": "1",
        "name": "Warna",
        "values": [
          { "id": "1", "value": "Merah" },
          { "id": "2", "value": "Hitam" }
        ]
      }
    ]
  }
}
```

## Get List untuk Point of Sales

Endpoint : GET /api/v1/products/point-of-sales/list

Hanya mengambil produk berstatus `ACTIVE` dan memiliki variant dengan stok > 0. Dipakai di halaman kasir.

Query Params :

- `search` (optional) - cari berdasarkan nama produk
- `categoryId` (optional) - filter berdasarkan kategori

Response Body (Success) :

```json
{
  "data": [
    {
      "id": "1",
      "name": "Sweater Rajut",
      "description": "Sweater rajut bahan wol premium",
      "categoryId": "1",
      "useVariant": true,
      "variants": [
        {
          "id": "1",
          "sku": "SW-001",
          "price": "150000",
          "image": "https://res.cloudinary.com/.../variant.jpg",
          "stock": 25,
          "options": [
            {
              "productVariantId": "1",
              "variantValueId": "1",
              "variantValue": { "value": "Merah" }
            }
          ]
        }
      ]
    }
  ]
}
```

## Create

> Membutuhkan autentikasi (role: `OWNER`, `ADMIN`).

Endpoint : POST /api/v1/products

Request Body (produk dengan variant) :

```json
{
  "name": "Sweater Rajut",
  "description": "Sweater rajut bahan wol premium",
  "useVariant": true,
  "categoryId": "1",
  "type": "READY_STOCK",
  "status": "ACTIVE",
  "variantsTypes": [
    { "name": "Warna", "values": ["Merah", "Hitam"] },
    { "name": "Bahan", "values": ["Wol"] }
  ],
  "variants": [
    {
      "sku": "SW-001",
      "price": 150000,
      "cost": 90000,
      "options": { "Warna": "Merah", "Bahan": "Wol" }
    },
    {
      "sku": "SW-002",
      "price": 150000,
      "cost": 90000,
      "options": { "Warna": "Hitam", "Bahan": "Wol" }
    }
  ]
}
```

Request Body (produk tanpa variant) :

```json
{
  "name": "Topi Rajut",
  "description": "Topi rajut polos",
  "useVariant": false,
  "categoryId": "1",
  "type": "READY_STOCK",
  "status": "ACTIVE",
  "variants": [
    {
      "sku": "TP-001",
      "price": 50000,
      "cost": 25000,
      "options": {}
    }
  ]
}
```

Catatan :

- Jika `useVariant: true`, `variants` dan `variantsTypes` wajib diisi, dan setiap variant wajib memiliki opsi untuk setiap tipe varian yang didefinisikan.
- SKU tidak boleh duplikat.
- Setiap variant yang dibuat otomatis mendapat baris `ProductVariantStock` dengan stok awal `0`.

Response Body (Success) :

```json
{
  "data": {
    "id": "1",
    "name": "Sweater Rajut",
    "description": "Sweater rajut bahan wol premium",
    "useVariant": true,
    "categoryId": "1",
    "type": "READY_STOCK",
    "status": "ACTIVE",
    "variants": [
      { "id": "1", "sku": "SW-001", "price": "150000", "cost": "90000" }
    ]
  }
}
```

## Update

> Membutuhkan autentikasi (role: `OWNER`, `ADMIN`).

Endpoint : PUT /api/v1/products/:id

Request Body : sama seperti Create, dengan tambahan `id` pada tiap variant yang ingin diperbarui (variant tanpa `id` akan dibuat baru, variant lama yang tidak disertakan akan dihapus beserta gambarnya di Cloudinary).

Catatan : Jika struktur tipe varian berubah (`variantsTypes` berbeda dari data lama) padahal variant lama sudah dipakai di produksi/transaksi POS, request akan ditolak — hanya harga, biaya, dan SKU yang boleh diubah dalam kondisi tersebut.

Response Body (Success) : sama seperti response Create.

## Hapus

> Membutuhkan autentikasi (role: `OWNER`, `ADMIN`).

Endpoint : DELETE /api/v1/products/:id

Catatan : Menghapus seluruh gambar variant terkait di Cloudinary.

Response Body (Success) : sama seperti response Create.

## Upload Gambar Variant

> Membutuhkan autentikasi (role: `OWNER`, `ADMIN`).

Endpoint : PATCH /api/v1/products/:id/upload

Content-Type : `multipart/form-data`

Request Body :

- `variantIds` - JSON string array of variant id, contoh `["1", "2"]`
- `images` - file gambar, jumlah harus sama dengan jumlah `variantIds` (maks. 10 file, urutan `images[i]` dipasangkan dengan `variantIds[i]`)

Response Body (Success) :

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "sku": "SW-001",
      "image": "https://res.cloudinary.com/.../variant.jpg"
    }
  ]
}
```
