'use strict';

var config = require('../../config.json');
var log4js = require('log4js');

log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file(config.logfile.access), 'LOG');

var logger = log4js.getLogger('LOG');

logger.setLevel('INFO');

var lastMessages = {};
var maximum = 10;

module.exports.push = function (channel, elt) {
  logger.info('MSG ' + channel + '\t' + elt.user.pseudo + ' (' + elt.ip + ')' + '\t' + elt.message);
  if (lastMessages[channel] === undefined) lastMessages[channel] = [];

  lastMessages[channel].push(elt);
  if (lastMessages[channel].length > maximum) lastMessages[channel].shift();
};

module.exports.forEach = function (channel, fn) {
  if (lastMessages[channel] === undefined) lastMessages[channel] = [];
  lastMessages[channel].forEach(fn);
};
