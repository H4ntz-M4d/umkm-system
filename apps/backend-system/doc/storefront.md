# Storefront (Public) API Spec

Endpoint katalog untuk sisi belanja online. **Tanpa autentikasi** — semuanya
read-only dan hanya mengembalikan produk berstatus `ACTIVE`. Filter status
dipasang mati di service, tidak bisa dilewati lewat query param.

## Get Products

Endpoint : GET /api/v1/public/products

Query Params :

- `skip` (optional) - jumlah data yang dilewati, default `0`
- `limit` (optional) - jumlah data per halaman, default `12`
- `search` (optional) - cari berdasarkan nama produk
- `categoryId` (optional) - filter kategori
- `type` (optional) - `READY_STOCK` | `MADE_TO_ORDER` | `PRE_ORDER`
- `sort` (optional) - `newest` (default) | `price_asc` | `price_desc`

`priceMin`/`priceMax` diratakan dari variant produk. `totalStock` adalah jumlah
stok seluruh variant — produk `MADE_TO_ORDER`/`PRE_ORDER` boleh bernilai `0` dan
tetap ditampilkan.

Response Body (Success) :

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Sweater Rajut",
      "slug": "sweater-rajut",
      "description": "Sweater rajut bahan wol premium",
      "type": "READY_STOCK",
      "categoryId": "1",
      "categoryName": "Pakaian",
      "image": "https://res.cloudinary.com/.../variant.jpg",
      "priceMin": "150000",
      "priceMax": "185000",
      "totalStock": 25
    }
  ],
  "meta": {
    "skip": 0,
    "limit": 12,
    "total": 34,
    "timeStamp": "2026-07-27T03:51:01.696Z"
  }
}
```

## Get Product Detail

Endpoint : GET /api/v1/public/products/:slug

Diambil berdasarkan `slug` (unik), bukan id. Mengembalikan seluruh bahan yang
dibutuhkan selector varian di halaman detail: `variantTypes` (dengan
`isHaveVisual`), `imageGroups` (dengan `signature`), dan `variants` yang membawa
`options` berupa peta `namaTipeVariant -> nilai`.

Response Body (Success) :

```json
{
  "success": true,
  "data": {
    "id": "1",
    "name": "Sweater Rajut",
    "slug": "sweater-rajut",
    "description": "Sweater rajut bahan wol premium",
    "type": "READY_STOCK",
    "categoryId": "1",
    "categoryName": "Pakaian",
    "image": "https://res.cloudinary.com/.../merah-1.jpg",
    "priceMin": "150000",
    "priceMax": "185000",
    "totalStock": 25,
    "useVariant": true,
    "variants": [
      {
        "id": "1",
        "sku": "SW-001-M-MERAH",
        "price": "150000",
        "image": "https://res.cloudinary.com/.../merah-1.jpg",
        "imageGroupId": "3",
        "stock": 10,
        "options": { "Warna": "Merah", "Ukuran": "M" }
      }
    ],
    "variantTypes": [
      {
        "id": "1",
        "name": "Warna",
        "isHaveVisual": true,
        "values": [{ "id": "1", "value": "Merah" }]
      },
      {
        "id": "2",
        "name": "Ukuran",
        "isHaveVisual": false,
        "values": [{ "id": "3", "value": "M" }]
      }
    ],
    "imageGroups": [
      {
        "id": "3",
        "signature": "[[\"Warna\",\"Merah\"]]",
        "values": [{ "id": "1", "value": "Merah", "typeName": "Warna" }],
        "images": [
          {
            "id": "9",
            "image": "https://res.cloudinary.com/.../merah-1.jpg",
            "sortOrder": 0
          }
        ]
      }
    ]
  }
}
```

Response Body (Failed) :

```json
{
  "success": false,
  "error": { "code": 400, "message": "Produk tidak ditemukan" }
}
```

## Get Categories

Endpoint : GET /api/v1/public/categories

Hanya kategori dengan `status: true`. Dipakai untuk filter katalog.

Response Body (Success) :

```json
{
  "success": true,
  "data": [{ "id": "1", "name": "Pakaian" }]
}
```
