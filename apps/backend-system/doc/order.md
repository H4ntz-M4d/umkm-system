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
