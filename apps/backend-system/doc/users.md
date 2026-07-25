# Users API Spec

> Seluruh endpoint di bawah ini membutuhkan autentikasi (role: `OWNER`, `ADMIN`).

## Get All Employees

Endpoint : GET /api/v1/users/employees

Mengambil user dengan role staff (`ADMIN`, `GUDANG`, `KASIR`, `OWNER`).

Query Params :

- `skip` (optional) - jumlah data yang dilewati, default `0`
- `limit` (optional) - jumlah data per halaman, default `10`
- `search` (optional) - cari berdasarkan nama employee

Response Body (Success) :

```json
{
  "data": [
    {
      "id": "1",
      "storeId": "1",
      "email": "admin@nurfacraft.com",
      "name": "Rendy Setiawan",
      "phone": "081233112121",
      "role": "ADMIN",
      "isActive": true,
      "createdAt": "2026-07-25T03:51:01.696Z",
      "slug": null
    }
  ]
}
```

## Get All Customers

Endpoint : GET /api/v1/users/customers

Query Params :

- `skip` (optional) - jumlah data yang dilewati, default `0`
- `limit` (optional) - jumlah data per halaman, default `10`

Response Body (Success) :

```json
{
  "data": [
    {
      "id": "2",
      "storeId": null,
      "email": "angga@gmail.com",
      "name": "Angga Saputra",
      "phone": "081233112121",
      "role": "CUSTOMER",
      "isActive": true,
      "createdAt": "2026-07-25T03:51:01.696Z",
      "slug": null
    }
  ]
}
```

## Get By Id

Endpoint : GET /api/v1/users/:id

Response Body (Success) :

```json
{
  "data": {
    "id": "1",
    "email": "admin@nurfacraft.com",
    "name": "Rendy Setiawan",
    "address": "Jl. Malioboro No. 1",
    "phone": "081233112121",
    "image": "https://res.cloudinary.com/.../profile.jpg",
    "isActive": true,
    "storeId": "1",
    "role": "ADMIN"
  }
}
```

## Create

Endpoint : POST /api/v1/users

Content-Type : `multipart/form-data`

Request Body :

```json
{
  "name": "Rendy Setiawan",
  "email": "admin@nurfacraft.com",
  "password": "rahasia123",
  "confirmPassword": "rahasia123",
  "role": "ADMIN",
  "isActive": true,
  "storeId": 1,
  "address": "Jl. Malioboro No. 1",
  "phone": "081233112121",
  "image": "(file, optional)"
}
```

Catatan : `role` tidak boleh bernilai `CUSTOMER`.

Response Body (Success) :

```json
{
  "data": {
    "id": "1",
    "name": "Rendy Setiawan",
    "address": "Jl. Malioboro No. 1",
    "phone": "081233112121",
    "image": "https://res.cloudinary.com/.../profile.jpg",
    "userId": "1"
  }
}
```

## Update

Endpoint : PATCH /api/v1/users/:id

Content-Type : `multipart/form-data`

Request Body (seluruh field opsional, `password`/`confirmPassword` wajib diisi berpasangan jika ingin mengganti password) :

```json
{
  "name": "Rendy Setiawan",
  "email": "admin@nurfacraft.com",
  "role": "ADMIN",
  "isActive": true,
  "storeId": 1,
  "address": "Jl. Malioboro No. 1",
  "phone": "081233112121",
  "image": "(file, optional)"
}
```

Response Body (Success) :

```json
{
  "data": {
    "id": "1",
    "name": "Rendy Setiawan",
    "address": "Jl. Malioboro No. 1",
    "phone": "081233112121",
    "image": "https://res.cloudinary.com/.../profile.jpg",
    "userId": "1"
  }
}
```

## Hapus

Endpoint : DELETE /api/v1/users/:id

Response Body (Success) :

```json
{
  "data": {
    "id": "1",
    "storeId": "1",
    "email": "admin@nurfacraft.com",
    "name": "Rendy Setiawan",
    "phone": "081233112121",
    "role": "ADMIN",
    "isActive": true,
    "createdAt": "2026-07-25T03:51:01.696Z",
    "slug": null
  }
}
```
