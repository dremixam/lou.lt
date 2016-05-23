'use strict';

var config = require('../../config.json');
var log4js = require('log4js');
log4js.replaceConsole();
var path = require('path');
var log = require('../models/log.js')(config, path.relative('.', __filename));

var messagesModel = require('../models/messages');
var clientList = require('../models/user');
var socketModel = require('../models/socket');
var torchecker = require('torchecker');

torchecker.start(config.ip);

module.exports = function (socket, db) {
  var userIp = socket.handshake.headers['x-real-ip'] || socket.handshake.address || socket.handshake.address.address;
  log.debug('user from ' + userIp + ' is waiting to join a channel');

  if (torchecker.check(userIp)) {
    log.debug(userIp + ' répertoriée comme ip TOR. On refuse l\'utilisateur.');
    socket.emit('error', 'tor');
    socket.close();
    return;
  } else {
    log.debug(userIp + ' ok');
  }

  socket.on('join', function (channel) {
    log.debug('user from ' + userIp + ' joins ' + channel);
    socketModel.set(socket.id, 'channel', channel);

    socket.join(channel);

    clientList.add(socket, db, function (newUserData) {
      // On transmet au nouveau client la liste des personnes en ligne
      log.debug('liste des clients');
      clientList.forEach(channel, function (entry) {
        socket.emit('nouveau_client', entry.public);
      });
      log.debug('on envoie au channel ' + channel + ' le nouveau user ' + JSON.stringify(newUserData.public));
      socket.to(channel).emit('nouveau_client', newUserData.public);
      socket.emit('connected', newUserData.public);
      messagesModel.forEach(channel, function (message) {
        log.debug('Derniers messages : ' + JSON.stringify(message));
        socket.emit('lastmessage', message);
      });
    });

    socket.on('disconnect', function () {
      var userData = socketModel.get(socket.id, 'userData');
      if ( typeof userData === 'undefined') return;
      clientList.remove(channel, userData.public.uuid);
      socket.to(channel).emit('disconnected', userData.public);
      socketModel.remove(socket.id);
    });
  });


};
