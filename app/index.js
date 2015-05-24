'use strict';

var config = require('../config.json');
var log4js = require('log4js');
log4js.replaceConsole();
var path = require('path');
var log = require('./models/log.js')(config, path.relative('.', __filename));

var messagesRoute = require('./routes/messages');
var channelJoinRoute = require('./routes/channelJoin');
var tldjs = require('tldjs');
var socketModel = require('./models/socket');

module.exports = function (io) {

  log.debug('on charge les routes');
  io.on('connection', function (socket) {
    log.debug('connexion' + socket.id + ' from ' + socket.handshake.address);
    socketModel.push(socket.id);
    socket.emit('connecting');

    channelJoinRoute(socket);
    /*
    //La gestion de la langue ne se fait plus par le sous domaine.

    var lng = tldjs.getSubdomain(socket.handshake.headers.host.split(':').shift());

    if (['fr', 'en'].indexOf(lng) === -1) lng = 'en';

    */

    /*
    var lng = 'fr';

    socketModel.set(socket.id, 'lng', lng);

    // On prévient l'utilisateur qu'il est bien en train de se connecter




    messagesRoute(socket);
*/
  });

};
