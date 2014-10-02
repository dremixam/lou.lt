var fs = require('fs');

var allClients = {};
var allSockets = {};

module.exports.add = function (socket, fn) {
  socket.get("lng", function (err, lng) {
    socket.get("channel", function (err, channel) {

      if (allClients[channel] === undefined) allClients[channel] = {};
      if (allSockets[channel] === undefined) allSockets[channel] = {};

      var userData = {};

      var hs = socket.handshake;

      if (socket.handshake.session.userData !== undefined) {
        userData = socket.handshake.session.userData;
        userData.last = Date.now();
        userData.ip = socket.handshake.headers['x-real-ip'] || socket.handshake.address.address;
        userData.public.like = userData.public.like || 0;
        userData.public.thumb = userData.public.thumb || 0;

        if (userData.voice[lng] === undefined) {
          if (lng == 'fr') {
            userData.voice[lng] = "fr" + getRandomInt(1, 6);
          } else if (lng == 'en') {
            userData.voice[lng] = "us" + getRandomInt(1, 3);
          } else {
            userData.voice[lng] = "en1";
          }
        }

        updateLastMessage(socket);
        allClients[channel][userData.public.uuid] = userData;
        socket.handshake.session.userData = userData;
        socket.handshake.session.save();
        //socket.emit("debug", "session data saved");
        fn(userData);
      } else {
        // Quand on a une nouvelle connection, on ouvre le fichier qui contient les noms possibles
        fs.readFile("./names.txt", function (err, data) {

          // En cas d'erreur on arrête
          if (err) throw err;

          //Sinon on récupère un nom aléatoirement dans le fichier
          var lines = data.toString().split('\n');
          pseudo = eval("(" + lines[Math.floor(Math.random() * lines.length)] + ")");

          // Si le nom est vide, on met magicarpe histoire de troller
          if (pseudo == "") pseudo = eval('({"n":"129", "fr": "Magicarpe", "en": "Magikarp"})');

          // On récupère une couleur qu'on attribue au nouvel utilisateur
          color = makecolor();

          var uuid = makeuuid();

          // On sauvegarde toutes les données de l'utilisateur
          userData = {
            voice: {
              fr: "fr" + getRandomInt(1, 6),
              en: "us" + getRandomInt(1, 3)
            },
            params: " -p " + getRandomInt(1, 99) + " -s " + getRandomInt(100, 175),
            last: Date.now(),
            ip: socket.handshake.headers['x-real-ip'] || socket.handshake.address.address,
            public: {
              uuid: uuid,
              pseudo: pseudo,
              color: color,
              like: 0,
              thumb: 0
            }
          };

          allClients[channel][uuid] = userData;
          allSockets[channel][uuid] = socket;

          // On initialise la date du dernier message

          socket.handshake.session.userData = userData;



          socket.handshake.session.save();

          updateLastMessage(socket);
          fn(userData);
        });
      }

    });
  });
}

module.exports.forEach = function (channel, fn) {

  if (allClients[channel] === undefined) allClients[channel] = {};
  if (allSockets[channel] === undefined) allSockets[channel] = {};
  for (uuid in allClients[channel]) {
    fn(allClients[channel][uuid]);
  }
}

module.exports.remove = function (channel, uuid) {

  if (allClients[channel] === undefined) allClients[channel] = {};
  if (allSockets[channel] === undefined) allSockets[channel] = {};
  delete allClients[channel][uuid];
  delete allSockets[channel][uuid];
}

function updateLastMessage(socket) {
  socket.handshake.session.userData.last = socket.handshake.session.userData.last || Date.now();
  if (Date.now() < socket.handshake.session.userData.last + 300) {
    return false;
  } else {
    socket.handshake.session.userData.last = Date.now();
    socket.handshake.session.save();
    return true;
  }
}

module.exports.updateLastMessage = updateLastMessage;

function makecolor() {
  var lines = ["#001F3F", "#0074D9", "#39CCCC", "#3D9970", "#01FF70", "#FF851B", "#85144B", "#F012BE", "#B10DC9"];
  var text = lines[Math.floor(Math.random() * lines.length)];
  return text;
}

function makeuuid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  for (var i = 0; i < 32; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
