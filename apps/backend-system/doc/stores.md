# Stores API Spec

## Get All

> Membutuhkan autentikasi (role: `OWNER`, `ADMIN`).

Endpoint : GET /api/v1/stores

Query Params :

- `skip` (optional) - jumlah data yang dilewati, default `0`
- `limit` (optional) - jumlah data per halaman, default `10`

Response Body (Success) :

```json
{
  "data": [
    {
      "id": "1",
      "name": "Nurfa Craft Jogja",
      "isActive": true,
      "createdAt": "2026-07-25T03:51:01.696Z"
    }
  ]
}
```

## Get List (Simple)

> Membutuhkan autentikasi (role: `OWNER`, `ADMIN`).

Endpoint : GET /api/v1/stores/list

Mengambil seluruh toko dalam bentuk sederhana, dipakai untuk dropdown/select.

Response Body (Success) :

```json
{
  "data": [
    {
      "id": "1",
      "name": "Nurfa Craft Jogja"
    }
  ]
}
```

## Create

Endpoint : POST /api/v1/stores

Request Body :

```json
{
  "name": "Nurfa Craft Jogja",
  "isActive": true
}
```

Response Body (Success) :

```json
{
  "data": {
    "id": "1",
    "name": "Nurfa Craft Jogja",
    "isActive": true,
    "createdAt": "2026-07-25T03:51:01.696Z"
  }
}
```

## Update

Endpoint : PATCH /api/v1/stores/:id

Request Body (seluruh field opsional) :

```json
{
  "name": "Nurfa Craft Jogja",
  "isActive": true
}
```

Response Body (Success) :

```json
{
  "data": {
    "id": "1",
    "name": "Nurfa Craft Jogja",
    "isActive": true,
    "createdAt": "2026-07-25T03:51:01.696Z"
  }
}
```

## Hapus

Endpoint : DELETE /api/v1/stores/:id

Response Body (Success) :

```json
{
  "data": {
    "id": "1",
    "name": "Nurfa Craft Jogja",
    "isActive": true,
    "createdAt": "2026-07-25T03:51:01.696Z"
  }
}
```
