const chalk = require('chalk');
const moment = require('moment-timezone');
const fs = require('fs-extra');
const path = require('path');
const stripAnsi = require('strip-ansi').default;

const getTime = () => moment().tz('Asia/Karachi').format('hh:mm:ss A');
const getDate = () => moment().tz('Asia/Karachi').format('DD/MM/YYYY');
const getDateTime = () => `${getTime()} || ${getDate()}`;

const logsDir = path.join(__dirname, '../../Data/system/database/botdata/logs');
const terminalLogFile = path.join(__dirname, '../system/log.txt');

const writeLog = (type, message) => {
  const cleanMessage = stripAnsi(String(message)).trim();
  const logEntry = `[${getDateTime()}] [${type}] ${cleanMessage}\n`;
  const date = moment().tz('Asia/Karachi').format('DD-MM-YYYY');
  const logFile = path.join(logsDir, `${date}.log`);
  
  if (global.io) {
    global.io.emit('log', { type, message: cleanMessage, time: getDateTime() });
  }
  
  try {
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    fs.appendFileSync(logFile, logEntry);
  } catch (e) {
    console.error('Log write error:', e.message);
  }
};

const printBanner = () => {
  console.log('');
  console.log(chalk.cyan(' +================================================+'));
  console.log(chalk.cyan(' |') + chalk.yellow('   mmm  m    m   mm   mm   m mmmm              ') + chalk.cyan(' |'));
  console.log(chalk.cyan(' |') + chalk.yellow(' m"   " #    #   ##   #"m  # #   "m            ') + chalk.cyan(' |'));
  console.log(chalk.cyan(' |') + chalk.green(' #      #mmmm#  #  #  # #m # #    #            ') + chalk.cyan(' |'));
  console.log(chalk.cyan(' |') + chalk.green(' #      #    #  #mm#  #  # # #    #            ') + chalk.cyan(' |'));
  console.log(chalk.cyan(' |') + chalk.magenta('  "mmm" #    # #    # #   ## #mmm"             ') + chalk.cyan(' |'));
  console.log(chalk.cyan(' |') + chalk.red('                                               ') + chalk.cyan(' |'));
  console.log(chalk.cyan(' |') + chalk.green.bold('       ★  C H A N D   B O T  ★                 ') + chalk.cyan(' |'));
  console.log(chalk.cyan(' |') + chalk.blue('           Facebook Messenger Bot              ') + chalk.cyan(' |'));
  console.log(chalk.cyan(' +================================================+'));
  console.log('');
};

const logs = {
  banner: printBanner,
  
  info: (title, ...args) => {
    const message = args.join(' ');
    console.log(chalk.cyan('ℹ') + ' ' + chalk.gray(`[${getTime()}]`) + ' ' + chalk.blue.bold('[INFO]') + ' ' + chalk.white(title) + ' ' + chalk.gray(message));
    writeLog('INFO', `[${title}] ${message}`);
  },

  success: (title, ...args) => {
    const message = args.join(' ');
    console.log(chalk.green('✓') + ' ' + chalk.gray(`[${getTime()}]`) + ' ' + chalk.green.bold('[SUCCESS]') + ' ' + chalk.white(title) + ' ' + chalk.gray(message));
    writeLog('SUCCESS', `[${title}] ${message}`);
  },

  error: (title, ...args) => {
    const message = args.join(' ');
    console.log(chalk.red('✗') + ' ' + chalk.gray(`[${getTime()}]`) + ' ' + chalk.red.bold('[ERROR]') + ' ' + chalk.white(title) + ' ' + chalk.gray(message));
    writeLog('ERROR', `[${title}] ${message}`);
  },

  warn: (title, ...args) => {
    const message = args.join(' ');
    console.log(chalk.yellow('⚠') + ' ' + chalk.gray(`[${getTime()}]`) + ' ' + chalk.yellow.bold('[WARN]') + ' ' + chalk.white(title) + ' ' + chalk.gray(message));
    writeLog('WARN', `[${title}] ${message}`);
  },

  command: (name, user, threadID) => {
    console.log(chalk.blue('»') + ' ' + chalk.gray(`[${getTime()}]`) + ' ' + chalk.blue.bold('[COMMAND]') + ' ' + chalk.cyan(name) + ' ' + chalk.gray('by') + ' ' + chalk.yellow(user) + ' ' + chalk.gray('in') + ' ' + chalk.magenta(threadID));
    writeLog('COMMAND', `${name} by ${user} in ${threadID}`);
  },

  event: (type, threadID) => {
    console.log(chalk.magenta('•') + ' ' + chalk.gray(`[${getTime()}]`) + ' ' + chalk.magenta.bold('[EVENT]') + ' ' + chalk.cyan(type) + ' ' + chalk.gray('in') + ' ' + chalk.yellow(threadID));
    writeLog('EVENT', `${type} in ${threadID}`);
  },
  
  getBrand: () => ({ name: BRAND_NAME, whatsapp: BRAND_WHATSAPP, email: BRAND_EMAIL })
};

module.exports = logs;
