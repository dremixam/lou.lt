var loultApp = angular.module('loultApp', []);

var audioPlayer = 0;
// Connexion à socket.io
var socket = io.connect('/');

var connected = false;
var ignorelist = [];
var me = undefined;

loultApp.controller('UserListCtrl', function ($scope) {
  $scope.userlist = [];

  $scope.language = window.location.hostname.split(".")[0];

  // Quand un nouveau client se connecte, on affiche l'information
  socket.on('nouveau_client', function(data) {
    console.log("nouveau client" + data);
    var result = $scope.userlist.filter(function( obj ) {
      return obj.uuid == data.uuid;
    });
    if ( result.length == 1 ) {
      result[0].count++;
    } else if ( result.length == 0 ) {
      data.count = 1;
      $scope.userlist.push(data);
    } else {
      location.reload();
    }
    $scope.$apply();
  });
  socket.on('connecting', function(){
    console.log("connecting");
    $scope.userlist = [];
    $scope.$apply();
  });

  socket.on('update_user', function(data) {
    var result = $scope.userlist.filter(function( obj ) {
      return obj.uuid == data.uuid;
    });
    if ( result.length == 1 ) {
      result[0] = data;
    }
    $scope.$apply();
  });

  // Quand un nouveau client se connecte, on affiche l'information
  socket.on('disconnected', function(data) {
    console.log("disconnected" + data);
    var result = $scope.userlist.filter(function( obj ) {
      return obj.uuid == data.uuid;
    });
    if (me !== undefined && data.uuid != me.uuid) {
      if ( result[0].count > 1 ) {
        result[0].count--;
      } else if ( result[0].count == 1 ) {
        delete result[0];
      }
    }
    $scope.$apply();
  });

  // Quand on reçoit un message, on l'insère dans la page
  socket.on('connected', function(data) {
    console.log("connected" + data);
    me = data;
    var result = $scope.userlist.filter(function( obj ) {
      return obj.uuid == data.uuid;
    });
    if ( result.length == 1 ) {
      result[0].count++;
    } else if ( result.length == 0 ) {
      data.count = 1;
      $scope.userlist.push(data);
    } else {
      location.reload();
    }
    $scope.$apply();
    $('#message').removeAttr("disabled").focus();
    connected = true;
  })






  // Ajoute un message dans la page
  function insereDebug(message) {
    insereLigne("[Debug]", "debug", message, null);
  }
  function insereErreur(message) {
    insereLigne("[Erreur]", "error", message, null);
  }
  function insereMessage(pseudo, message, color) {
    insereLigne(pseudo+" <img src='/res/pkmn/"+pseudo+".gif'>", "", message, color);
  }
  function insereLastMessage(pseudo, message, color) {
    insereLigne(pseudo+" <img src='/res/pkmn/"+pseudo+".gif'>", "old", message, color);
  }
  function insereOwnMessage(pseudo, message, color) {
    insereLigne(pseudo+" <img src='/res/pkmn/"+pseudo+".gif'>", "own", message, color);
  }

  function insereLigne(premier, classe, second, color) {
    if (color === null)
    $('#zone_chat').append('<div class="ligne '+classe+'"><div class="premier">' + premier + '</div><div class="second">' + second + '<div><div class="lineTimer">'+currentTime()+'</div></div>');
    else
    $('#zone_chat').append('<div class="ligne '+classe+'"><div class="premier" style="color: '+color+';">' + premier + '</div><div class="second">' + second + '<div><div class="lineTimer">'+currentTime()+'</div></div>');

    if ($('#zone_chat').scrollTop()+$('#zone_chat').height() >  ($('#zone_chat')[0].scrollHeight-$('#zone_chat').height()/2)) {
      $('#zone_chat').stop().animate({ scrollTop: $('#zone_chat')[0].scrollHeight }, 500);
    }
  }


});
