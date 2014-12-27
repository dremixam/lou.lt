'use strict';
var Cleverbot = require('cleverbot');
var messagesModel = require('../models/messages');


module.exports = function () {
  var CBot = new Cleverbot();
  var botInfo;
  var ready = false;
};

module.exports.prototype.connect = function (callback) {
  fs.readFile('./names.txt', function (err, data) {

    // En cas d'erreur on arrête
    if (err) throw err;

    //Sinon on récupère un nom aléatoirement dans le fichier
    var lines = data.toString().split('\n');
    var selectedName = '';
    do {
      selectedName = lines[Math.floor(Math.random() * lines.length)];
    } while (selectedName === '');

    var pseudo = eval('(' + selectedName + ')');

    // On récupère une couleur qu'on attribue au nouvel utilisateur
    var color = makecolor();

    var uuid = makeuuid();

    // On sauvegarde toutes les données de l'utilisateur
    botInfo = {
      'voice': {
        fr: 'fr' + getRandomInt(1, 6),
        en: 'us' + getRandomInt(1, 3)
      },
      'params': ' -p ' + getRandomInt(1, 99) + ' -s ' + getRandomInt(100, 175),
      'last': Date.now(),
      'ip': null,
      'public': {
        uuid: uuid,
        pseudo: pseudo,
        color: color,
        like: 0,
        thumb: 0
      }
    };
    ready = true;
    allClients[channel][uuid] = userData;
    callback();
  });
};

module.exports.prototype.talk = function (callback) {
  repeatTalking = function () {

    this.CBot.write();

    setTimeout(repeatTalking, getRandomInt(5000, 20000));
  };
};






var CBots = [new Cleverbot(), new Cleverbot(), new Cleverbot()],
  i = 0,
  name = ['George', 'Jack', 'Sam'],
  callback = function callback(resp) {
    CBots[i].write(resp.message, callback);
    console.log(name[i = ((i + 1) % 3)], ' : ', resp.message);
  };




callback({
  message: 'Bonjour'
});
