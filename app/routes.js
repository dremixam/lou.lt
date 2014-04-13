var clientList = require('./models/user');
var messagesRoute = require("./routes/messages");
var messagesModel = require('./models/messages');
var fs = require('fs');
var tldjs = require('tldjs');

module.exports = function(io) {

	io.sockets.on('connection', function (socket, pseudo) {
		// Gestion de la session
		var hs = socket.handshake;

		var lng = tldjs.getSubdomain(socket.handshake.headers.host.split(":").shift());

		socket.set("lng", lng);
		socket.join(lng);

		if (["fr","en"].indexOf(lng) == -1) return;

		// setup an inteval that will keep our session fresh
		var intervalID = setInterval(function () {
			hs.session.reload( function () {
				hs.session.touch().save();
			});
		}, 60 * 1000);

		// On prévient l'utilisateur qu'il est bien en train de se connecter
		socket.emit('connecting');

		clientList.add(socket, function(newUserData) {
			// On transmet au nouveau client la liste des personnes en ligne
			clientList.forEach(lng, function(entry) {
				socket.emit('nouveau_client', entry.public);
			});

			socket.broadcast.to(lng).emit('nouveau_client', newUserData.public);

			socket.emit('nouveau_client', newUserData.public);

			fs.readFile("./motd."+lng+".txt", function(err, data){
				if (!err) {
					var lines = data.toString().split('\n');

					lines.forEach(function(elt){
						if (elt.length > 0)
							socket.emit('info', elt.toString());
					});
				}
				socket.emit('connected', newUserData.public);

				messagesModel.forEach(lng, function(message){
					socket.emit('lastmessage', message);
				});
			});
		});

		messagesRoute(socket);

		socket.on('disconnect', function() {
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
