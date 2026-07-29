/**
 * Structured Production Logger.
 * Lightweight, zero-dependency console logger formatted with ISO timestamps and log levels.
 */
const config = require('./index');

class Logger {
  static formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaString = Object.keys(meta).length ? ` | Meta: ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaString}`;
  }

  static info(message, meta) {
    console.log(this.formatMessage('INFO', message, meta));
  }

  static warn(message, meta) {
    console.warn(this.formatMessage('WARN', message, meta));
  }

  static error(message, error = {}) {
    const errMeta = {
      message: error.message || error,
      stack: config.env === 'development' ? error.stack : undefined
    };
    console.error(this.formatMessage('ERROR', message, errMeta));
  }
}

module.exports = Logger;
