(function () {
  'use strict';
  var DEBUG = true;

  function d(message) {
    if (DEBUG) {
      console.log('[DEBUG] ' + message);
    }
  }

  function e(message) {
    if (DEBUG) {
      console.error('[ERROR] ' + message);
    }
  }

  var loultApp = angular.module('loultApp', ['ngMaterial', 'ngMessages', 'ngAudio']);

  var audioPlayer = 0;
  var connected = false;
  var me;

  loultApp.config(['$mdThemingProvider', function ($mdThemingProvider) {
    $mdThemingProvider.theme('default')
      .primaryPalette('blue')
      .accentPalette('pink');
    $mdThemingProvider.theme('docs-dark', 'default')
      .primaryPalette('blue')
      .accentPalette('pink')
      .dark();
  }]);


  //Factory pour la gestion de la connexion socket.io

  loultApp.service('$socket', ['$rootScope',
    function ($rootScope) {
      d('connecting');
      var socket = io.connect('http://localhost:8090/', {
        'force new connection': true,
        'reconnection limit': 10000,
        'max reconnection attempts': Infinity
      });
      this.on = function (eventName, callback) {
        socket.on(eventName, function () {
          d('recv:' + eventName + ':' + JSON.stringify(arguments));
          var args = arguments;
          $rootScope.$apply(function () {
            if (callback) {
              callback.apply(socket, args);
            }
          });
        });
      };
      this.emit = function (eventName, data, callback) {
        socket.emit(eventName, data, function () {
          var args = arguments;
          d('send:' + eventName + ':' + JSON.stringify(arguments));
          $rootScope.$apply(function () {
            if (callback) {
              callback.apply(socket, args);
            }
          });
        });
      };
      this.removeAllListeners = function () {
        socket.removeAllListeners();
      };
  }]);

  // Controller pour la gestion des menus sur les cotés.
  loultApp.controller('mainCtrl', ['$scope', '$mdSidenav', function ($scope, $mdSidenav) {
    $scope.channel = window.location.pathname;
    $scope.toggleSideNav = function (name) {
      $mdSidenav(name).toggle();
    };
  }]);

  // Controller pour la liste des utilisateurs
  loultApp.controller('UserListCtrl', ['$scope', '$socket',
    function ($scope, $socket) {
      $scope.userlist = [];

      $scope.language = 'fr';
      $socket.on('connect', function () {
        $socket.emit('join', location.pathname);
      });

      // ajouter a la liste les nouveaux clients (il faudra revoir ici pour éviter les fantomes)
      $socket.on('nouveau_client', function (data) {
        var result = $scope.userlist.filter(function (obj) {
          return obj.uuid === data.uuid;
        });
        if (result.length === 1) {
          result[0].count++;
        } else if (result.length === 0) {
          data.count = 1;
          data.muted = false;
          $scope.userlist.push(data);
        } else {
          location.reload();
        }
      });

      // Réinitialisation de la liste des utilisateur lorsqu'on se connecte
      $socket.on('connecting', function () {
        $scope.userlist = [];
      });

      // Mise a jour d'un utilisateur'
      $socket.on('update_user', function (data) {
        var result = $scope.userlist.filter(function (obj) {
          return obj.uuid === data.uuid;
        });
        if (result.length === 1) {
          result[0] = data;
        }
      });

      // Supression de la liste des utilisateurs qui se déconnectent.
      $socket.on('disconnected', function (data) {

        var result = $scope.userlist.filter(function (obj) {
          return obj.uuid === data.uuid;
        });
        if (me !== undefined && data.uuid !== me.uuid) {
          if (result[0].count > 1) {
            result[0].count--;
          } else if (result[0].count === 1) {
            $scope.userlist.splice($scope.userlist.indexOf(result[0]), 1);
          }
        }

      });

      // On vient de se connecter, on initialise tout
      $socket.on('connected', function (data) {
        me = data;
        var result = $scope.userlist.filter(function (obj) {
          return obj.uuid === data.uuid;
        });
        if (result.length === 1) {
          result[0].count++;
        } else if (result.length === 0) {
          data.count = 1;
          $scope.userlist.push(data);
        } else {
          location.reload();
        }
        connected = true;
      });

  }]);

  loultApp.controller('MessageListCtrl', ['$scope', '$socket', 'ngAudio',
    function ($scope, $socket, ngAudio) {
      $scope.messagelist = [];


      $scope.glued = true;

      $socket.on('message', function (data) {
        var result = $scope.userlist.filter(function (obj) {
          return obj.uuid === data.user.uuid;
        });
        if (!result[0].muted) {
          $scope.pushMessage({
            'premier': data.user.pseudo,
            'paragraphes': [{
              text: data.message,
              class: '',
              count: 1
            }],
            'color': data.color,
            'date': new Date(),
            'uuid': data.user.uuid,
            'avatar': '/res/charapic/' + data.user.avatar
          });

          document.getElementById('audio' + (audioPlayer % 10)).src = data.audiofile;
          document.getElementById('audio' + (audioPlayer % 10)).play();
          audioPlayer++;
        }
      });

      $socket.on('lastmessage', function (data) {
        $scope.pushMessage({
          'premier': data.user.pseudo,
          'paragraphes': [{
            text: data.message,
            class: 'old',
            count: 1
            }],
          'color': data.color,
          'date': new Date(Date.parse(data.time)),
          'uuid': data.user.uuid,
          'avatar': '/res/charapic/' + data.user.avatar
        });
      });

      $socket.on('ownmessage', function (data) {
        //document.getElementById('message').placeholder = 'Message...';
        document.getElementById('audio' + (audioPlayer % 10)).src = data.audiofile;
        document.getElementById('audio' + (audioPlayer % 10)).play();
        audioPlayer++;
        $scope.pushMessage({
          'premier': data.user.pseudo,
          'paragraphes': [{
            text: data.message,
            class: 'own',
            count: 1
            }],
          'color': data.color,
          'date': new Date(),
          'uuid': data.user.uuid,
          'avatar': '/res/charapic/' + data.user.avatar
        });
      });

      $socket.on('errormsg', function (data) {
        //document.getElementById('message').placeholder = 'Message...';
        $scope.pushMessage({
          'premier': '[Error]',
          'paragraphes': [{
            text: data.message,
            class: 'error',
            count: 1
            }],
          'color': null,
          'date': new Date(),
          'uuid': 'error',
          'avatar': '/lib/material-design-icons/action/svg/design/ic_info_24px.svg'
        });
      });

      $socket.on('info', function (data) {
        $scope.pushMessage({
          'premier': '[Info]',
          'paragraphes': [{
            text: data,
            class: 'info',
            count: 1
            }],
          'color': null,
          'date': new Date(),
          'uuid': 'info',
          'avatar': '/lib/material-design-icons/action/svg/design/ic_info_24px.svg'
        });
      });

      $socket.on('disconnect', function () {
        $scope.pushMessage({
          'premier': '[Info]',
          'paragraphes': [{
            text: 'Waiting for new connection…',
            class: 'join',
            count: 1
            }],
          'color': null,
          'date': new Date(),
          'uuid': 'info',
          'avatar': '/lib/material-design-icons/action/svg/design/ic_info_24px.svg'
        });
      });

      $socket.on('connecting', function () {
        $scope.pushMessage({
          'premier': '[Info]',
          'paragraphes': [{
            text: 'Connecting…',
            class: 'join',
            count: 1
            }],
          'color': null,
          'date': new Date(),
          'uuid': 'info',
          'avatar': '/lib/material-design-icons/action/svg/design/ic_info_24px.svg'
        });
      });

      $socket.on('connected', function (data) {
        $scope.pushMessage({
          'premier': '[Info]',
          'paragraphes': [{
            text: 'Connected as ' + data.pseudo + '.',
            class: 'join',
            count: 1
            }],
          'color': null,
          'date': new Date(),
          'uuid': 'info',
          'avatar': '/lib/material-design-icons/action/svg/design/ic_info_24px.svg'
        });
      });

      $scope.pushMessage = function (messageObject) {
        var lastMessage = $scope.messagelist[$scope.messagelist.length - 1];
        if (typeof lastMessage !== 'undefined' && lastMessage.uuid === messageObject.uuid) {
          var lastParagraphe = lastMessage.paragraphes[lastMessage.paragraphes.length - 1];
          if (lastParagraphe.text === messageObject.paragraphes[0].text) {
            lastParagraphe.count++;
          } else {
            lastMessage.paragraphes.push(messageObject.paragraphes[0]);
          }
          lastMessage.date = new Date();
        } else {
          $scope.messagelist.push(messageObject);
        }
      };
  }]);


  loultApp.controller('TitleCtrl', ['$scope', function ($scope) {
    $scope.channel = location.pathname;
  }]);

  loultApp.controller('TextBoxCtrl', ['$scope', '$socket',
    function ($scope, $socket) {
      // Lorsqu'on envoie le formulaire, on transmet le message et on l'affiche sur la page
      $scope.submit = function () {
        var message = $scope.textMessage;
        var first = message.split(' ')[0];
        var next = message.substr(message.indexOf(' ') + 1);
        if (first.charAt(0) === '/') {
          $socket.emit('command', {
            cmd: first.substring(1),
            args: next
          });
        } else {
          $socket.emit('message', message); // Transmet le message aux autres
        }
        $scope.textMessage = '';

        return false; // Permet de bloquer l'envoi 'classique' du formulaire
      };

  }]);

})();
