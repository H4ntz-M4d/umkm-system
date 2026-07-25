# Auth API Spec

Autentikasi menggunakan cookie httpOnly (`access_token_admin`/`refresh_token_admin` untuk staff, `access_token_customer`/`refresh_token_customer` untuk customer). Tidak ada token yang dikembalikan lewat response body.

## Login Admin/Staff

Endpoint : POST /api/auth/management/login

Request Body :

```json
{
  "email": "admin@nurfacraft.com",
  "password": "rahasia123"
}
```

Response Body (Success) :

```json
{
  "data": {
    "message": "Login Success, selamat datang"
  }
}
```

## Refresh Token Admin/Staff

Endpoint : POST /api/auth/management/ref

Menggunakan cookie `refresh_token_admin` untuk menerbitkan access token baru.

Response Body (Success) :

```json
{
  "message": "Success",
  "accessToken": "<jwt_access_token>"
}
```

## Get Profile Admin/Staff

Endpoint : GET /api/auth/management/me

> Membutuhkan autentikasi (role: `OWNER`, `ADMIN`, `KASIR`, `GUDANG`).

Response Body (Success) :

```json
{
  "id": "1",
  "email": "admin@nurfacraft.com",
  "role": "ADMIN",
  "isActive": true,
  "storeId": "1",
  "name": "Rendy Setiawan",
  "storeName": "Nurfa Craft Jogja"
}
```

## Logout

Endpoint : POST /api/auth/logout

> Membutuhkan autentikasi.

Response Body (Success) :

```json
{
  "message": "Logged Out"
}
```

## Register Customer

Endpoint : POST /api/auth/customer/register

Request Body :

```json
{
  "name": "Angga Saputra",
  "email": "angga@gmail.com",
  "password": "rahasia123",
  "confirmPassword": "rahasia123",
  "phone": "081233112121"
}
```

Response Body (Success) :

```json
{
  "data": {
    "name": "Angga Saputra",
    "email": "angga@gmail.com",
    "phone": "081233112121"
  }
}
```

## Login Customer

Endpoint : POST /api/auth/customer/login

Request Body :

```json
{
  "email": "angga@gmail.com",
  "password": "rahasia123"
}
```

Response Body (Success) :

```json
{
  "data": {
    "message": "Login Success, selamat datang"
  }
}
```

## Refresh Token Customer

Endpoint : POST /api/auth/c/ref

Menggunakan cookie `refresh_token_customer` untuk menerbitkan access token baru.

Response Body (Success) :

```json
{
  "message": "Success"
}
```

## Get Profile Customer

Endpoint : GET /api/auth/me/c

> Membutuhkan autentikasi (role: `CUSTOMER`).

Response Body (Success) :

```json
{
  "id": "2",
  "email": "angga@gmail.com",
  "role": "CUSTOMER",
  "isActive": true,
  "name": "Angga Saputra"
}
```
