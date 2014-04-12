var clientList = require('./models/user');
var messagesRoute = require("./routes/messages");
var messagesModel = require('./models/messages');
var fs = require('fs');


module.exports = function(io) {

	io.sockets.on('connection', function (socket, pseudo) {
		// Gestion de la session
		var hs = socket.handshake;

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
			clientList.forEach(function(entry) {
				socket.emit('nouveau_client', entry.public);
			});

			socket.broadcast.emit('nouveau_client', newUserData.public);

			socket.emit('nouveau_client', newUserData.public);

			fs.readFile("./motd.txt", function(err, data){

				if(err) throw err;

				var lines = data.toString().split('\n');

				lines.forEach(function(elt){
					socket.emit('info', elt.toString());
				});

				socket.emit('connected', {"pseudo": newUserData.public.pseudo});

				messagesModel.forEach(function(message){
					socket.emit('lastmessage', message);
				});
			});



		});




		messagesRoute(socket);

		socket.on('disconnect', function() {
			var public = socket.handshake.session.userData.public;
			var uuid = socket.handshake.session.userData.public.uuid;
			setTimeout(function () {
				socket.broadcast.emit('disconnected', public);
				clientList.remove(uuid);
			}, 4 * 1000);

			clearInterval(intervalID);
		});

	});
};
