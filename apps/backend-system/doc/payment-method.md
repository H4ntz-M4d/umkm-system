# Payment Method API Spec

## Get All

Endpoint : GET /api/v1/payment-method

Response Body (Success) :

```json
{
  "data": [
    {
      "id": "1",
      "name": "BRI",
      "channel": "BANK_TRANSFER",
      "isActive": true,
      "bankName": "BRI",
      "accountName": "Nurfa Craft",
      "accountNumber": "1234567890"
    },
    {
      "id": "2",
      "name": "Tunai",
      "channel": "CASH",
      "isActive": true
    }
  ]
}
```

## Create

Endpoint : POST /api/v1/payment-method

Request Body :

```json
{
  "name": "BRI",
  "channel": "BANK_TRANSFER",
  "isActive": true,
  "bankAccount": {
    "bankName": "BRI",
    "accountName": "Nurfa Craft",
    "accountNumber": "1234567890"
  }
}
```

Catatan : `bankAccount` wajib diisi jika `channel` bernilai `BANK_TRANSFER`. Nilai `channel` yang tersedia : `CASH`, `BANK_TRANSFER`, `MIDTRANS`.

Response Body (Success) :

```json
{
  "data": {
    "id": "1",
    "name": "BRI",
    "channel": "BANK_TRANSFER",
    "isActive": true
  }
}
```

## Update

Endpoint : PUT /api/v1/payment-method/:id

Request Body :

```json
{
  "name": "BRI",
  "channel": "BANK_TRANSFER",
  "isActive": true,
  "bankAccount": {
    "bankName": "BRI",
    "accountName": "Nurfa Craft",
    "accountNumber": "1234567890"
  }
}
```

Response Body (Success) :

```json
{
  "data": {
    "id": "1",
    "name": "BRI",
    "channel": "BANK_TRANSFER",
    "isActive": true
  }
}
```

## Hapus

Endpoint : DELETE /api/v1/payment-method/:id

Response Body (Success) :

```json
{
  "data": {
    "id": "1",
    "name": "BRI",
    "channel": "BANK_TRANSFER",
    "isActive": true
  }
}
```
