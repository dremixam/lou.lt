var clientList = require('./models/user');
var messagesRoute = require("./routes/messages");
var channelJoinRoute = require('./routes/channelJoin');
var fs = require('fs');
var tldjs = require('tldjs');

module.exports = function (io) {

  io.sockets.on('connection', function (socket, pseudo) {
    // Gestion de la session
    var hs = socket.handshake;

    var lng = tldjs.getSubdomain(socket.handshake.headers.host.split(":").shift());


    if (["fr", "en"].indexOf(lng) == -1) lng = "en";

    socket.set("lng", lng);


    // setup an inteval that will keep our session fresh
    var intervalID = setInterval(function () {
      hs.session.reload(function () {
        hs.session.touch().save();
      });
    }, 60 * 1000);

    // On prévient l'utilisateur qu'il est bien en train de se connecter
    socket.emit('connecting');

    channelJoinRoute(socket);

    messagesRoute(socket);

    socket.on('disconnect', function () {
      var public = socket.handshake.session.userData.public;
      var uuid = socket.handshake.session.userData.public.uuid;
      clientList.remove(lng, uuid);
      setTimeout(function () {
        socket.broadcast.to(lng).emit('disconnected', public);

      }, 4 * 1000);

      clearInterval(intervalID);
    });

  });
};
