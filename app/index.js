'use strict';

var config = require('../config.json');
var log4js = require('log4js');
log4js.replaceConsole();
var path = require('path');
var log = require('./models/log.js')(config, path.relative('.', __filename));

var messagesRoute = require('./routes/messages');
var channelJoinRoute = require('./routes/channelJoin');
var socketModel = require('./models/socket');

module.exports = function (io, db) {

  log.debug('on charge les routes');
  io.on('connection', function (socket) {
    log.debug('connexion' + socket.id + ' from ' + socket.handshake.address);
    socketModel.push(socket.id);
    socket.emit('connecting');

    channelJoinRoute(socket, db);

    messagesRoute(socket, db);
  });

};
