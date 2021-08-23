#!/usr/bin/env node
'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const supportedCoins = require('./src/supportedCoins.json');
const { generateWallet } = require('./src/wallet');
const log = console.log;

program.option('-c, --coin <ticker>', 'Wallet for specoinkeyfic coin', 'ETH');
program.option('-p, --prefix <prefix>', 'Desired wallet prefix (case sensitive)');
program.option('-pi, --prefix-ignorecase <prefix>', 'Desired wallet prefix (case insensitive)');
program.parse();

const options = program.opts();
const coin = options.coin || '';
const prefix = options.prefix || options.prefixIgnorecase || '';
const prefixIgnoreCase = options.prefixIgnorecase !== undefined;
const regexpFlags = 'g' + (prefixIgnoreCase ? 'i' : '');

async function run() {
    if (!Object.keys(supportedCoins).includes(coin)) {
        log(chalk.red('⛔️  Error: coin not supported!'));
        process.exit(1);
    }

    const coinData = supportedCoins[coin];

    let wallet = {};
    let prefixFound = false;

    if (prefix && typeof coinData === 'object' && 'startsWith' in coinData && 'prefixTest' in coinData) {
        if (prefix.split('').filter(char => !RegExp(coinData.prefixTest, regexpFlags).test(char)).length === 0) {
            if (prefix.length > 1 || 'rareSymbols' in coinData && RegExp(coinData.rareSymbols, regexpFlags).test(prefix)) {
                log(`⏳  Generating wallet with "${prefix}" prefix, this might take a while...`);
            }
            const startsWithSymbols = coinData.startsWith.split('|');
            loop:
            while (true) {
                wallet = await generateWallet(coin, coinData);
                for (let firstSymbol of startsWithSymbols) {
                    if (!prefixIgnoreCase && wallet.address.startsWith(firstSymbol + '' + prefix) || prefixIgnoreCase && (wallet.address).toUpperCase().startsWith((firstSymbol + '' + prefix).toUpperCase())) {
                        prefixFound = true;
                        break loop;
                    }
                }
            }
        } else {
            log(chalk.red('⛔️  Error: prefix contains non-supported characters!'));
            process.exit(1);
        }
    } else {
        if (prefix) {
            log(`😢  ${chalk.yellow('Sorry, ' + coin + ' doesn\'t support prefix yet...')}`);
        }
        wallet = await generateWallet(coin, coinData);
    }

    log(`✨  ${chalk.green('Done!')} ${chalk.blueBright('Here is your brand new ' + (coinData.name || coin) + ' wallet' + (prefixFound ? ' with "' + prefix + '" prefix' : '') + ':')}\n`);
    if (prefixFound) {
        const addressCutLength = coinData.startsWith.length + prefix.length;
        log(`👛  ${coinData.startsWith}${chalk.magenta(wallet.address.slice(coinData.startsWith.length, addressCutLength))}${wallet.address.slice(addressCutLength)}`);
    } else {
        log(`👛  ${wallet.address}`);
    }
    log(`🔑  ${wallet.privateKey}`);
    if (wallet.mnemonic) {
        log(`📄  ${wallet.mnemonic}`);
    }
    if (coinData.multi) {
        log();
        log(chalk.greenBright('ℹ️   This wallet could be imported into MetaMask or Trust Wallet (multi wallet)'));
    }  
}

run();
