'use strict';

var config = require('../../config.json');
var log4js = require('log4js');
log4js.replaceConsole();
var path = require('path');
var log = require('../models/log.js')(config, path.relative('.', __filename));

var messagesModel = require('../models/messages');
var clientList = require('../models/user');
var socketModel = require('../models/socket');
var fs = require('fs');

module.exports = function (socket) {
  var userIp = socket.handshake.headers['x-real-ip'] || socket.handshake.address || socket.handshake.address.address;
  log.debug('user from ' + userIp + ' is waiting to join a channel');
  socket.on('join', function (channel) {
    log.debug('user from ' + userIp + ' joins ' + channel);
    socketModel.set(socket.id, 'channel', channel);
    var hs = socket.handshake;
    socket.join(channel);
    // setup an inteval that will keep our session fresh
    //        var intervalID = setInterval(function () {
    //          hs.session.reload(function () {
    //            hs.session.touch().save();
    //          });
    //        }, 60 * 1000);

    //        clientList.add(socket, function (newUserData) {
    //          // On transmet au nouveau client la liste des personnes en ligne
    //          clientList.forEach(channel, function (entry) {
    //            socket.emit('nouveau_client', entry.public);
    //          });
    //          socket.to(channel).emit('nouveau_client', newUserData.public);
    //          socket.emit('connected', newUserData.public);
    //          messagesModel.forEach(channel, function (message) {
    //            log.debug("Derniers messages : " + JSON.stringify(message));
    //            socket.emit('lastmessage', message);
    //          });
    //        });

    socket.on('disconnect', function () {
      //var publicData = socket.handshake.session.userData.public;
      //var uuid = socket.handshake.session.userData.public.uuid;
      //clientList.remove(channel, uuid);
      //socket.to(channel).emit('disconnected', publicData);
      //socketModel.remove(socket.id);
      //clearInterval(intervalID);
    });
  });


};
