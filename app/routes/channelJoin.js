'use strict';

var messagesModel = require('../models/messages');
var clientList = require('../models/user');
var socketModel = require('../models/socket');
var fs = require('fs');

module.exports = function (socket) {



  fs.readFile('banlist.json', 'utf8', function (err, data) {
    if (err) {
      //console.log('Error: ' + err);
      return;
    }

    if (typeof socket.handshake === 'undefined') {
      return;
    }

    var banlist = JSON.parse(data);
    var userIp = socket.handshake.headers['x-real-ip'] || socket.handshake.address.address;


    if (banlist.banned.indexOf(userIp) !== -1) {
      socket.disconnect('unauthorized');
      return 0;
    } else {





      socket.on('join', function (channel) {

        socketModel.set(socket.id, 'channel', channel);

        var hs = socket.handshake;



        socket.join(channel);
        // setup an inteval that will keep our session fresh
        var intervalID = setInterval(function () {
          hs.session.reload(function () {
            hs.session.touch().save();
          });
        }, 60 * 1000);

        clientList.add(socket, function (newUserData) {
          // On transmet au nouveau client la liste des personnes en ligne
          clientList.forEach(channel, function (entry) {
            socket.emit('nouveau_client', entry.public);
          });
          socket.broadcast.to(channel).emit('nouveau_client', newUserData.public);
          socket.emit('nouveau_client', newUserData.public);
          socket.emit('connected', newUserData.public);
          messagesModel.forEach(channel, function (message) {
            //console.log("Derniers messages : " + JSON.stringify(message));
            socket.emit('lastmessage', message);
          });
        });
        socket.on('disconnect', function () {
          var uuid = socket.handshake.session.userData.public.uuid;
          clientList.remove(channel, uuid);
          setTimeout(function () {
            socket.broadcast.to(channel).emit('disconnected', public);
          }, 4 * 1000);

          socketModel.remove(socket.id);

          clearInterval(intervalID);
        });
      });




    }
  });



};
