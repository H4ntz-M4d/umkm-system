# Transaction Flow API Spec

## Get All

Endpoint : GET /api/v1/transaction-flow

Query Params :

- `page` (required) - halaman data, dimulai dari `0`
- `limit` (required) - jumlah data per halaman
- `store` (optional) - filter berdasarkan `storeId`
- `type` (optional) - filter berdasarkan tipe transaksi, salah satu dari `IN`, `OUT`
- `source` (optional) - filter berdasarkan sumber transaksi, salah satu dari `POS`, `ORDER`, `EXPENSE`, `PRODUCTION`

Response Body (Success) :

```json
{
  "data": [
    {
      "id": "1",
      "storeId": "1",
      "storeName": "Nurfa Craft Jogja",
      "type": "IN",
      "amount": 100000,
      "source": "POS",
      "createdAt": "2026-07-25T03:51:01.696Z"
    }
  ]
}
```

## Get Summary

Endpoint : GET /api/v1/transaction-flow/summary

Response Body (Success) :

```json
{
  "data": {
    "transactionIn": 5000000,
    "transactionOut": 2000000,
    "netTransaction": 3000000
  }
}
```
