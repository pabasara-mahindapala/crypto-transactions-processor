# crypto-transactions-processor

## How to use it

1. Run `npm install` from the transactions-processor directory.
2. Run `npm start -- -h` to get started.

### Parameters       
        
Parameter | Example | Description
-------------- | ---------- | ----------
-f | ./resources/transactions.csv | Path to the CSV file with transactions
-t | BTC | Token Type
-d | 2019-10-25 | Date

### Examples

`npm start -- -f ./resources/transactions.csv`

Returns the latest portfolio value per token in USD  

`npm start -- -f ./resources/transactions.csv -t BTC`

Returns the latest portfolio value for BTC in USD  

`npm start -- -f ./resources/transactions.csv -d 2019-10-25`

Returns the portfolio value per token in USD on 2019-10-26  

`npm start -- -f ./resources/transactions.csv -t BTC -d 2019-10-25`

Returns the portfolio value of BTC in USD on 2019-10-25


