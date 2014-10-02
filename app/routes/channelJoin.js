var messagesModel = require('../models/messages');
var clientList = require('../models/user');

module.exports = function (socket) {

  socket.on('join', function (channel) {
    socket.join(channel);

    clientList.add(socket, function (newUserData) {
      // On transmet au nouveau client la liste des personnes en ligne
      clientList.forEach(channel, function (entry) {
        socket.emit('nouveau_client', entry.public);
      });

      socket.broadcast.to(channel).emit('nouveau_client', newUserData.public);

      socket.emit('nouveau_client', newUserData.public);

      /*      fs.readFile("./motd." + lng + ".txt", function (err, data) {
        if (!err) {
          var lines = data.toString().split('\n');

          lines.forEach(function (elt) {
            if (elt.length > 0)
              socket.emit('info', elt.toString());
          });
        }*/
      socket.emit('connected', newUserData.public);

      messagesModel.forEach(channel, function (message) {
        socket.emit('lastmessage', message);
      });
    });
  });


};
