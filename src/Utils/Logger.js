import log4js from 'log4js'

log4js.configure({
  appenders: {
    everything: {
      type: 'file',
      filename: `${__dirname}./../../logs.txt`,
      maxLogSize: 10485760,
      backups: 3,compress: true
    }
  },
  categories: { default: { appenders: ['everything'], level: 'debug' } }
});

const logger = log4js.getLogger('cheese');

export {
  logger
}
