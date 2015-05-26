'use strict';

var config = require('../../config.json');
var log4js = require('log4js');
log4js.replaceConsole();
var path = require('path');
var log = require('../models/log.js')(config, path.relative('.', __filename));

module.exports = {
  socket: {},
  push: function (newSocketID) {
    if (typeof this.socket[newSocketID] === 'undefined') {
      this.socket[newSocketID] = {};
    }
    log.debug('push de la nouvelle socket ' + newSocketID);
  },
  remove: function (socketID) {
    if (typeof this.socket[socketID] !== 'undefined') {
      log.debug('remove de la socket ' + socketID);
      delete this.socket[socketID];
    }
  },
  getSocketById: function (id) {
    if (typeof this.socket[id] !== 'undefined') {
      return this.socket[id];
    }
  },
  set: function (id, key, value) {
    if (typeof this.socket[id] !== 'undefined') {
      this.socket[id][key] = value;
    }
  },
  get: function (id, key) {
    //console.log(this.socket);
    if (typeof this.socket[id] !== 'undefined') {
      return this.socket[id][key];
    }

  }
};
