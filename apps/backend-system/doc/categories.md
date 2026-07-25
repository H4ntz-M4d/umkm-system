# Categories API Spec

> Seluruh endpoint di bawah ini membutuhkan autentikasi (role: `OWNER`, `ADMIN`, `KASIR`).

## Get All

Endpoint : GET /api/v1/categories

Query Params :

- `search` (optional) - cari berdasarkan nama kategori

Response Body (Success) :

```json
{
  "data": [
    {
      "id": "1",
      "name": "Rajutan",
      "description": "Kategori produk rajutan",
      "status": true,
      "slug": "rajutan",
      "productCount": 12
    }
  ]
}
```

## Get List (Simple)

Endpoint : GET /api/v1/categories/list

Mengambil kategori yang aktif saja (`status: true`), dipakai untuk dropdown/select.

Response Body (Success) :

```json
{
  "data": [
    {
      "id": "1",
      "name": "Rajutan"
    }
  ]
}
```

## Get Summary

Endpoint : GET /api/v1/categories/summary

Response Body (Success) :

```json
{
  "data": {
    "totalCategories": 8,
    "activeCategories": 6,
    "linkedProducts": 20
  }
}
```

## Get By Id

Endpoint : GET /api/v1/categories/:id

Response Body (Success) :

```json
{
  "id": "1",
  "name": "Rajutan",
  "description": "Kategori produk rajutan",
  "status": true,
  "slug": "rajutan"
}
```

## Create

Endpoint : POST /api/v1/categories

Request Body :

```json
{
  "name": "Rajutan",
  "description": "Kategori produk rajutan",
  "status": true,
  "slug": "rajutan"
}
```

Response Body (Success) :

```json
{
  "id": "1",
  "name": "Rajutan",
  "description": "Kategori produk rajutan",
  "status": true,
  "slug": "rajutan"
}
```

## Update

Endpoint : PUT /api/v1/categories/:id

Request Body :

```json
{
  "name": "Rajutan",
  "description": "Kategori produk rajutan",
  "status": true,
  "slug": "rajutan"
}
```

Response Body (Success) :

```json
{
  "id": "1",
  "name": "Rajutan",
  "description": "Kategori produk rajutan",
  "status": true,
  "slug": "rajutan"
}
```

## Hapus

Endpoint : DELETE /api/v1/categories/:id

Response Body (Success) :

```json
{
  "id": "1",
  "name": "Rajutan",
  "description": "Kategori produk rajutan",
  "status": true,
  "slug": "rajutan"
}
```
