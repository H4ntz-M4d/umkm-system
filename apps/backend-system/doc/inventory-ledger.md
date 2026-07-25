# Inventory Ledger API Spec

## Get All

Endpoint : GET /api/v1/inventory-ledger

Query Params :

- `skip` (optional) - jumlah data yang dilewati, default `0`
- `limit` (optional) - jumlah data per halaman, default `10`
- `search` (optional) - cari berdasarkan nama item
- `itemType` (optional) - filter berdasarkan tipe item, contoh `PRODUCT_VARIANT`
- `direction` (optional) - filter berdasarkan arah stok, salah satu dari `IN`, `OUT`
- `source` (optional) - filter berdasarkan sumber pergerakan stok, contoh `POS`, `PRODUCTION`

Response Body (Success) :

```json
{
  "data": [
    {
      "id": "1",
      "name": "Nurfa Craft Jogja",
      "itemType": "PRODUCT_VARIANT",
      "itemName": "Sweater Rajut - SW-001",
      "direction": "OUT",
      "source": "POS",
      "quantity": 2,
      "referenceId": "10",
      "createdAt": "2026-07-25T03:51:01.696Z"
    }
  ]
}
```

## Get Summary

Endpoint : GET /api/v1/inventory-ledger/summary

Response Body (Success) :

```json
{
  "data": {
    "stockFlow": {
      "totalIn": 500,
      "totalOut": 320
    },
    "historyByType": {
      "productVariant": 45,
      "rawMaterial": 0
    }
  }
}
```
