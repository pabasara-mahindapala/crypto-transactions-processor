#!/usr/bin/env node

const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const program = require('commander');
const csv = require('csv-parser');
const fs = require('fs');
const config = require('config');
const https = require('https');

const main = () => {
    clear();
    console.log(
        chalk.cyan(
            figlet.textSync('transactions-processor', { horizontalLayout: 'full' })
        )
    );
    console.log('Version 1.0.0\n');

    program
        .version('1.0.0')
        .description("A CLI for processing transactions")
        .option('-f, --file <./path/to/file.csv>', 'Path to the CSV file')
        .option('-t, --token <type>', 'Select a Token Type')
        .option('-d, --date <yyyy-mm-dd>', 'Select a Date')
        .parse(process.argv);

    const options = program.opts();

    processTransactions(options);
}

const getStartTimestamp = (date) => {
    date.setHours(0, 0, 0, 0);
    return getTimeStamp(date);
}

const getTimeStamp = (date) => {
    return Math.floor(date.getTime() / 1000);
}

const getEndTimestamp = (date) => {
    date.setHours(23, 59, 59, 999);
    return getTimeStamp(date);
}

const updatePortfolio = (portfolio, row) => {
    if (!portfolio[row.token]) {
        portfolio[row.token] = 0;
    }

    if (row.transaction_type == 'DEPOSIT') {
        portfolio[row.token] += Number(row.amount);
    } else if (row.transaction_type == 'WITHDRAWAL') {
        portfolio[row.token] -= Number(row.amount);
    }
    portfolio[row.token] = Number(portfolio[row.token].toFixed(12));

    if (portfolio[row.token] < 0) {
        portfolio[row.token] = 0;
    }
}

const isValidDate = (d) => {
    return d instanceof Date && !isNaN(d);
}

const printResults = (portfolio) => {
    console.log(chalk.yellow('Your portfolio: '));
    for (var key in portfolio) {
        if (portfolio.hasOwnProperty(key)) {
            printValueInUSD(key, portfolio[key]);
        }
    }
}

const printValueInUSD = (token_type, amount) => {
    const api_key = config.get('api_key');
    const url = 'https://min-api.cryptocompare.com/data/price?fsym=' + token_type + '&tsyms=USD&api_key=' + api_key;

    https.get(url, res => {
        let data = '';
        res.on('data', chunk => {
            data += chunk;
        });
        res.on('end', () => {
            data = JSON.parse(data);
            console.log(chalk.cyan(token_type) + " -> " + chalk.greenBright((amount * data.USD).toFixed(12) + ' USD'));
        });
    }).on('error', err => {
        console.log(err.message);
    });
}

const processTransactions = (options) => {
    var date;
    var dateStart;
    var dateEnd;

    if (options.date) {
        date = new Date(options.date);

        if (!isValidDate(date)) {
            console.log('Input ' + options.date + ' is invalid.');
            return;
        }

        dateStart = getStartTimestamp(date);
        dateEnd = getEndTimestamp(date);
    }

    var portfolio = {};

    var count = 0;

    fs.createReadStream(options.file)
        .pipe(csv())
        .on('data', function (row) {
            if (date && options.token) {
                if (dateStart < row.timestamp && row.timestamp < dateEnd) {
                    if (row.token === options.token) {
                        updatePortfolio(portfolio, row);
                    }
                }
            } else if (options.token) {
                if (row.token === options.token) {
                    updatePortfolio(portfolio, row);
                }
            } else if (date) {
                if (dateStart < row.timestamp && row.timestamp < dateEnd) {
                    updatePortfolio(portfolio, row);
                }
            } else {
                updatePortfolio(portfolio, row);
            }

            count++;
            if (count % 500000 == 0) {
                process.stdout.write(count + ' records searched..');
                process.stdout.cursorTo(0);
            }
        })
        .on('end', function () {
            process.stdout.clearLine(0);
            console.log(count + ' records searched..');
            console.log("\n");
            printResults(portfolio);
        });
}

main();
