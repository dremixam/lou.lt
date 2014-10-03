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




    // On prévient l'utilisateur qu'il est bien en train de se connecter
    socket.emit('connecting');

    channelJoinRoute(socket);

    messagesRoute(socket);



  });
};
