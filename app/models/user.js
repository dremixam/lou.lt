var fs = require('fs');

var allClients = {};

module.exports.add = function (socket, fn) {
  var userData = {};

  var hs = socket.handshake;

  if ( hs.session.userData !== undefined ) {
    userData = hs.session.userData;
    userData.last=Date.now();
    userData.ip = socket.handshake.headers['x-real-ip'] || socket.handshake.address.address;
    userData.public.like = userData.public.like || 0;
    userData.public.thumb = userData.public.thumb || 0;
    socket.set('userData', userData);
    updateLastMessage(socket);
    allClients[userData.public.uuid] = userData;
    hs.session.userData = userData;
    hs.session.save();
    fn(userData);
  } else {
    // Quand on a une nouvelle connection, on ouvre le fichier qui contient les noms possibles
    fs.readFile("./names.txt", function(err, data){

      // En cas d'erreur on arrête
      if(err) throw err;

      //Sinon on récupère un nom aléatoirement dans le fichier
      var lines = data.toString().split('\n');
      pseudo = lines[Math.floor(Math.random()*lines.length)].replace(/[^a-zA-Z0-9 ,\.\?\!éùàçèÉÀÇÈÙ%êÊâÂûÛîÎöÖüÜëËäÄôÔñÑœŒïÏ\-♀♂]/ig, '');

      // Si le nom est vide, on met magicarpe histoire de troller
      if ( pseudo == "" ) pseudo = "Magicarpe";

      // On récupère une couleur qu'on attribue au nouvel utilisateur
      color = makecolor();

      var uuid = makeuuid();

      // On sauvegarde toutes les données de l'utilisateur
      userData = {
        socket: socket,
        voice: getRandomInt (1, 6),
        params: " -p "+getRandomInt (1, 99)+" -s "+getRandomInt (100, 175),
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

      allClients[uuid] = userData;

      // On initialise la date du dernier message

      hs.session.userData = userData;



      hs.session.save();
      updateLastMessage(socket);
      fn(userData);
    });
  }
}

module.exports.forEach = function (fn) {
  for(uuid in allClients) {
    fn(allClients[uuid]);
  }
}

module.exports.remove = function(uuid) {
  delete allClients[uuid];
}

function updateLastMessage(socket) {
  socket.handshake.session.userData.last = socket.handshake.session.userData.last || Date.now();
    if (Date.now() < socket.handshake.session.userData.last+300) {
      return false;
    } else {
      socket.handshake.session.userData.last=Date.now();
      socket.handshake.session.save();
      return true;
    }
}

module.exports.updateLastMessage = updateLastMessage;

function makecolor() {
  var lines = ["#001F3F", "#0074D9", "#39CCCC", "#3D9970", "#01FF70", "#FF851B", "#85144B", "#F012BE", "#B10DC9"];
  var text = lines[Math.floor(Math.random()*lines.length)];
  return text;
}

function makeuuid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  for( var i=0; i < 32; i++ )
  text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
