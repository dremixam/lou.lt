'use strict';
// imports =====================================================================

// Ces imports sont utiles pour le système de logging
var config = require('./config.json'); // load the config
var log4js = require('log4js');
log4js.replaceConsole();
var path = require('path');
var log = require('./app/models/log.js')(config, path.relative('.', __filename));
var MongoClient = require('mongodb'),
  Server = MongoClient.Server,
  Db = MongoClient.Db;

// Évidemment on a besoin de express et de socket.io
var express = require('express'); // load express
var favicon = require('serve-favicon');
var app = express(); // create express app
var server = require('http').createServer(app); // create webserver
var io = require('socket.io').listen(server, {
  logger: {
    debug: log.debug,
    info: log.info,
    error: log.error,
    warn: log.warn
  }
});

app.use(log4js.connectLogger(log, {
  level: 'auto'
}));
app.use(favicon(__dirname + '/static/dist/favicon.png'));
app.use(express.static(__dirname + '/static/dist'));

app.get('*', function (req, res) {
  log.info('Request for page ' + req.url + ' from ' + req.ip);
  //req.session.valid = true;
  res.sendFile(__dirname + '/static/dist/home.html');
});

log.info('host : '+config.db.host);
log.info('port : '+config.db.port);
log.info('db : '+config.db.name);
log.info('user : '+config.db.username);
log.info('pwd : '+config.db.pwd);



var mongoserver = new Server(config.db.host, config.db.port, {
  auto_reconnect: true,
  logger: log4js.connectLogger(log, {
    level: 'auto'
  })
});
var db = new Db(config.db.name, mongoserver);

db.open(function (err, db) {
  if (err) {
    log.error(err);
    return;
  }
  db.authenticate(config.db.username, config.db.pwd, function(err,res) {
    if(err) {
      log.error(err);
      return;
    }

    console.log('connecté a la bdd ' + db);

    // routes ======================================================================
    require('./app/')(io, db);

    // listen (start app with node server.js) ======================================
    server.listen(config.port, config.ip);
    log.info('App listening on ' + config.ip + ':' + config.port);
  });
});
