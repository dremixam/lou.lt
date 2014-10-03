var messagesModel = require('../models/messages');
var clientList = require('../models/user');

module.exports = function (socket) {

  socket.on('join', function (channel) {
    socket.join(channel);

    socket.set("channel", channel);
    var hs = socket.handshake;
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
        socket.emit('lastmessage', message);
      });
    });
    socket.on('disconnect', function () {
      var public = socket.handshake.session.userData.public;
      var uuid = socket.handshake.session.userData.public.uuid;
      clientList.remove(channel, uuid);
      setTimeout(function () {
        socket.broadcast.to(channel).emit('disconnected', public);
      }, 4 * 1000);

      clearInterval(intervalID);
    });
  });

};
