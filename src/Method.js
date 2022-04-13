const chalk = require('chalk');
const columnify = require('columnify');
const { log, supportedCoins } = require('./utils');
const { generateMnemonicString } = require('./Wallet');
const selfInfo = require('../package.json');
const CW = require('./CW');

class Method {
    constructor(name, params = {}) {
        this.name = name;
        this.params = params;
    }

    async init() {
        const callMethod = {
            '_': () => {},
            'list': () => {
                log(`🔠  All supported cryptos:\n`);
                let cryptos = {};
                for (const val of supportedCoins) {
                    const data = require('./coins/' + val + '.json');
                    let title = data.title || '';
                    if (title == '' || val == 'ERC') {
                        continue;
                    }
                    cryptos[chalk.blue(val)] = title;
                }
                log(columnify(cryptos, {
                    showHeaders: false,
                    columnSplitter: ' - ',
                }));
                log();
                log(`ℹ️   Use flag "-c TICKER" to select specific coin`);
            },
            'mnemonic': () => {
                log(`✨  ${chalk.green('Done!')} ${chalk.blueBright('Here is your randomly generated 12 words mnemonic string:')}\n`);
                log(`📄  ${generateMnemonicString()}`);
                log();
                log(chalk.greenBright('ℹ️   You can import this wallet into MetaMask, Trust Wallet and many other wallet apps'));
            },
            'version': () => {
                log(selfInfo.version);
            },
            'wallet': async () => {
                const coin = this.params.coin;
                const options = this.params.options;
                
                const cw = await new CW(coin, options).init();

                let coinFullName = (cw.row.name || coin) + (cw.wallet.format !== undefined && cw.wallet.format != '' ? ' (' + cw.wallet.format + ')' : '');

                if (cw.options.prefix && !cw.prefixFound) {
                    log(`😢  ${chalk.yellow('Sorry, ' + coinFullName + ' does not support prefix yet...')}`);
                }

                if (cw.options.suffix && !cw.suffixFound) {
                    log(`😢  ${chalk.yellow('Sorry, ' + coinFullName + ' does not support suffix yet...')}`);
                }

                if (cw.options.mnemonic != '' && cw.wallet.mnemonic == undefined) {
                    log(`😢  ${chalk.yellow('Sorry, ' + coinFullName + ' does not support mnemonic yet...')}`);
                }

                if (cw.wallet.error !== undefined) {
                    log(`⛔️  ${chalk.red(`Error: ${cw.wallet.error}`)}`);
                    return;
                }

                // prefix, suffix
                if (cw.prefixFound && cw.suffixFound) {
                    log(`✨  ${chalk.green('Done!')} ${chalk.blueBright('Here is your brand new ' + coinFullName + ' wallet with "' + cw.options.prefix + '" prefix and "' + cw.options.suffix + '" suffix:')}\n`);
                } else if (cw.prefixFound) {
                    log(`✨  ${chalk.green('Done!')} ${chalk.blueBright('Here is your brand new ' + coinFullName + ' wallet with "' + cw.options.prefix + '" prefix:')}\n`);
                } else if (cw.suffixFound) {
                    log(`✨  ${chalk.green('Done!')} ${chalk.blueBright('Here is your brand new ' + coinFullName + ' wallet with "' + cw.options.suffix + '" suffix:')}\n`);
                } else {
                    log(`✨  ${chalk.green('Done!')} ${chalk.blueBright('Here is your brand new ' + coinFullName + ' wallet:')}\n`);
                }

                // result
                if (cw.wallet.addresses !== undefined) {
                    if (cw.wallet.privateExtendedKey) {
                        log(`🔐  ${cw.wallet.privateExtendedKey}`);
                    }
                    if (cw.wallet.mnemonic) {
                        log(`📄  ${cw.wallet.mnemonic}`);
                    }

                    for (const item of cw.wallet.addresses) {
                        log();
                        if (cw.wallet.addresses.length > 1) {
                            log(`🆔  ${item.index}`);
                        }

                        if (cw.prefixFound && cw.prefixFoundInWallets.includes(item.address) && cw.suffixFound && cw.suffixFoundInWallets.includes(item.address)) {
                            // highlight found prefix
                            // log(`👛  ${item.address}`);
                            const addressCutPrefixLength = cw.row.startsWith.length + cw.options.prefix.length;
                            const addressFirstPart = item.address.slice(cw.row.startsWith.length, addressCutPrefixLength);
                            const addressLastPart = item.address.slice(item.address.length - cw.options.suffix.length);
                            log(`👛  ${cw.row.startsWith}${chalk.magenta(addressFirstPart)}${item.address.substring(cw.row.startsWith.length + addressFirstPart.length, item.address.length - addressLastPart.length)}${chalk.magenta(addressLastPart)}`);
                        } else if (cw.prefixFound && cw.prefixFoundInWallets.includes(item.address)) {
                            // highlight found prefix
                            const addressCutLength = cw.row.startsWith.length + cw.options.prefix.length;
                            log(`👛  ${cw.row.startsWith}${chalk.magenta(item.address.slice(cw.row.startsWith.length, addressCutLength))}${item.address.slice(addressCutLength)}`);
                        } else if (cw.suffixFound && cw.suffixFoundInWallets.includes(item.address)) {
                            // highlight found suffix
                            log(`👛  ${item.address.slice(0, item.address.length - cw.options.suffix.length)}${chalk.magenta(item.address.slice(item.address.length - cw.options.suffix.length))}`);
                        } else {
                            log(`👛  ${item.address}`);
                        }
                        log(`🔑  ${item.privateKey}`);
                    }

                    if (cw.row.path !== undefined && cw.options.geek) {
                        log();
                        log(`🗂   wallet address path: ${cw.row.path}'/0'/0/ID`);
                    }
                }
                
                if (cw.row.formats !== undefined || cw.row.network == 'EVM' || cw.row.apps || cw.wallet.tested !== undefined) {
                    log();
                }

                if (cw.wallet.tested !== undefined) {
                    log(chalk.red('‼️   This wallet generation format was not tested yet, do not use it!'));
                }

                if (cw.row.formats !== undefined && Object.keys(cw.row.formats).length > 1) {
                    let formatsString = '';
                    for (const val of Object.keys(cw.row.formats)) {
                        formatsString += chalk.blue(val) + ', ';
                    }
                    log(chalk.yellow('*️⃣   You can create different wallet formats: ' + formatsString.substring(0, formatsString.length - 2) + ' (use it with ' + chalk.white('-f') + ' flag)'));
                }

                if (cw.row.network == 'EVM' || false) {
                    log(chalk.yellow('🆒  You can use this wallet in Ethereum, Binance Smart Chain, Polygon and few more networks (EVM compatible)'));
                }

                if (cw.row.apps !== undefined) {
                    let apps = {
                        "metamask": "MetaMask",
                        "tronlink": "TronLink",
                        "trustwallet": "Trust Wallet",
                        "harmony-chrome-ext": "Harmony Chrome Extension Wallet",
                        "binance-chain-wallet": "Binance Chain Wallet"
                    }
                    let appsArray = [];

                    for (let key of Object.keys(apps)) {
                        if (cw.row.apps.includes(key)) {
                            appsArray.push(apps[key]);
                        }
                    }

                    let appsString = appsArray.join(', ');
                    if (cw.row.apps || false) {
                        appsString += ' and many other wallet apps';
                    }
                    log(chalk.greenBright('ℹ️   You can import this wallet into ' + appsString));
                }
            }
        }

        return (callMethod[this.name] || callMethod['_'])();
    }
}

module.exports = Method;
