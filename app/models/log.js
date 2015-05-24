var log4js = require('log4js');


module.exports = function (config, name, accessLog) {

  if (config.devel) {
    log4js.loadAppender('console');
  } else {
    log4js.loadAppender('file');
    log4js.addAppender(log4js.appenders.file(config.logfile.error), name);
  }
  var logger = log4js.getLogger(name);

  if (config.devel) {
    logger.setLevel('DEBUG');
  } else {
    logger.setLevel('ERROR');
  }

  return logger;
}
