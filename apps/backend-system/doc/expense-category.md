# Expense Category API Spec

## Get All

Endpoint : GET /api/v1/expense-category

Response Body (Success) :

```json
{
  "data": [
    {
      "id": "1",
      "name": "Bahan Baku",
      "description": "Pembelian bahan baku produksi",
      "color": "#FF5733",
      "isActive": true,
      "createdAt": "2026-07-25T03:51:01.696Z",
      "expenseCount": 5,
      "totalExpenses": 750000
    }
  ]
}
```

## Create

Endpoint : POST /api/v1/expense-category

Request Body :

```json
{
  "name": "Bahan Baku",
  "description": "Pembelian bahan baku produksi",
  "color": "#FF5733",
  "isActive": true
}
```

Response Body (Success) :

```json
{
  "data": {
    "id": "1",
    "name": "Bahan Baku",
    "description": "Pembelian bahan baku produksi",
    "color": "#FF5733",
    "isActive": true,
    "createdAt": "2026-07-25T03:51:01.696Z"
  }
}
```

## Update

Endpoint : PUT /api/v1/expense-category/:id

Request Body :

```json
{
  "name": "Bahan Baku",
  "description": "Pembelian bahan baku produksi",
  "color": "#FF5733",
  "isActive": true
}
```

Response Body (Success) :

```json
{
  "data": {
    "id": "1",
    "name": "Bahan Baku",
    "description": "Pembelian bahan baku produksi",
    "color": "#FF5733",
    "isActive": true,
    "createdAt": "2026-07-25T03:51:01.696Z"
  }
}
```

## Nonaktifkan Kategori

Endpoint : DELETE /api/v1/expense-category/status/:id

Menonaktifkan kategori (`isActive` menjadi `false`) tanpa menghapus datanya, karena kategori mungkin masih dipakai oleh data expense yang sudah ada.

Response Body (Success) :

```json
{
  "data": {
    "id": "1",
    "name": "Bahan Baku",
    "description": "Pembelian bahan baku produksi",
    "color": "#FF5733",
    "isActive": false,
    "createdAt": "2026-07-25T03:51:01.696Z"
  }
}
```

## Hapus Permanen

Endpoint : DELETE /api/v1/expense-category/:id

Menghapus kategori secara permanen dari database.

Response Body (Success) :

```json
{
  "data": {
    "id": "1",
    "name": "Bahan Baku",
    "description": "Pembelian bahan baku produksi",
    "color": "#FF5733",
    "isActive": true,
    "createdAt": "2026-07-25T03:51:01.696Z"
  }
}
```
