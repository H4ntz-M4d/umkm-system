# Expense API Spec

## Get All

Endpoint : GET /api/v1/expense

Query Params :

- `skip` (optional) - jumlah data yang dilewati, default `0`
- `limit` (optional) - jumlah data per halaman, default `10`
- `search` (optional) - cari berdasarkan deskripsi pengeluaran
- `category` (optional) - filter berdasarkan nama kategori pengeluaran
- `dateFrom` (optional) - filter tanggal mulai, format `YYYY-MM-DD`
- `dateTo` (optional) - filter tanggal akhir, format `YYYY-MM-DD`

Response Body (Success) :

```json
{
  "data": [
    {
      "id": "1",
      "storeId": "1",
      "categoryId": "1",
      "categoryName": "Bahan Baku",
      "description": "Beli benang wol",
      "totalAmount": "500000",
      "date": "2026-07-25T00:00:00.000Z",
      "createdAt": "2026-07-25T03:51:01.696Z"
    }
  ]
}
```

## Get Summary

Endpoint : GET /api/v1/expense/summary

Response Body (Success) :

```json
{
  "data": {
    "totalExpense": "12000000",
    "totalExpenseThisMonth": "1500000",
    "totalActiveCategory": 6
  }
}
```

## Create

Endpoint : POST /api/v1/expense

Request Body :

```json
{
  "storeId": "1",
  "categoryId": "1",
  "description": "Beli benang wol",
  "totalAmount": 500000,
  "date": "2026-07-25",
  "expenseItem": [
    {
      "itemName": "Benang Wol Merah",
      "quantity": 10,
      "unit": "gulung",
      "price": 50000,
      "subtotal": 500000
    }
  ]
}
```

Catatan : Membuat data expense juga otomatis mencatat `CashTransaction` bertipe `OUT` dengan `source: EXPENSE`.

Response Body (Success) :

```json
{
  "id": "1",
  "storeId": "1",
  "categoryId": "1",
  "description": "Beli benang wol",
  "totalAmount": "500000",
  "date": "2026-07-25T00:00:00.000Z",
  "createdAt": "2026-07-25T03:51:01.696Z",
  "expenseItem": [
    {
      "id": "1",
      "expenseId": "1",
      "itemName": "Benang Wol Merah",
      "quantity": 10,
      "unit": "gulung",
      "price": "50000",
      "subtotal": "500000"
    }
  ]
}
```

## Hapus

Endpoint : DELETE /api/v1/expense/:id

Catatan : Menghapus data expense juga menghapus `CashTransaction` terkait.

Response Body (Success) :

```json
{
  "id": "1",
  "storeId": "1",
  "categoryId": "1",
  "description": "Beli benang wol",
  "totalAmount": "500000",
  "date": "2026-07-25T00:00:00.000Z",
  "createdAt": "2026-07-25T03:51:01.696Z",
  "expenseItem": [
    {
      "id": "1",
      "expenseId": "1",
      "itemName": "Benang Wol Merah",
      "quantity": 10,
      "unit": "gulung",
      "price": "50000",
      "subtotal": "500000"
    }
  ]
}
```
