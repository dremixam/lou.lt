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
      data.muted = false;
      $scope.userlist.push(data);
      if (me != undefined)
        if ($scope.language == 'fr') insereLigne("[Info]", "join", 'Un '+data.pseudo.fr + ' sauvage apparait !', null);
        else insereLigne("[Info]", "join", 'Wild '+data.pseudo.en + ' appeared!', null);
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
        if ($scope.language == 'fr') insereLigne("[Info]", "part", 'Le '+data.pseudo.fr + ' sauvage s\'enfuit !', null);
        else insereLigne("[Info]", "part", 'Wild '+data.pseudo.en + ' fled!', null);
        delete $scope.userlist.splice($scope.userlist.indexOf(result[0]),1);
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

  //
// Tout ce qui suit est à revoir en grande partie
//

  // Quand on reçoit un message, on l'insère dans la page
  socket.on('message', function(data) {
    var result = $scope.userlist.filter(function( obj ) {
      return obj.uuid == data.user.uuid;
    });
    if (!result[0].muted) {
      insereMessage(data.user.pseudo, data.message, data.color, $scope.language);
      document.getElementById("audio"+(audioPlayer%10)).src = data.audiofile;
      document.getElementById("audio"+(audioPlayer%10)).play();
      audioPlayer++;
    }
  })

  // Historique des derniers messages
  socket.on('lastmessage', function(data) {
    if (ignorelist.indexOf(data.pseudo) == -1) {
      insereLastMessage(data.pseudo, data.message, data.color, $scope.language);
    }
  })
  socket.on('ownmessage', function(data) {
    document.getElementById("message").placeholder = "Message...";
    insereOwnMessage(data.user.pseudo, data.message, data.color, $scope.language);
    document.getElementById("audio"+(audioPlayer%10)).src = data.audiofile;
    document.getElementById("audio"+(audioPlayer%10)).play();
    audioPlayer++;
  })
  socket.on('debug', function(message) {
    insereDebug(message);
  })

  socket.on('errormsg', function(data) {
    document.getElementById("message").placeholder = "Message...";
    insereErreur(data.message);
  })

  socket.on('info', function(data) {
    insereLigne("[Info]", "info", data, null);
  })


  socket.on('attack', function(data) {
    if (connected) insereLigne("[Attaque]", "attack", data, null);
  })


  // Lorsqu'on envoie le formulaire, on transmet le message et on l'affiche sur la page
  $('#formulaire_chat').submit(function () {
    var message = $('#message').val();
    var first = message.split(' ')[0];
    var next = message.substr(message.indexOf(" ") + 1);
    if (first.charAt(0) == "/") {
      socket.emit('command', {cmd: first.substring(1), args: next});
    } else {
      socket.emit('message', message); // Transmet le message aux autres
    }

    $('#message').val('').focus(); // Vide la zone de Chat et remet le focus dessus
    //textMessage.$apply();
    return false; // Permet de bloquer l'envoi "classique" du formulaire
  });

  // Ajoute un message dans la page
  function insereDebug(message) {
    insereLigne("[Debug]", "debug", message, null);
  }
  function insereErreur(message) {
    insereLigne("[Erreur]", "error", message, null);
  }
  function insereMessage(pseudo, message, color, lng) {
    insereLigne(pseudo[lng]+" <img src='/res/pkmn/"+pseudo.fr+".gif'>", "", message, color);
  }
  function insereLastMessage(pseudo, message, color, lng) {
    insereLigne(pseudo[lng]+" <img src='/res/pkmn/"+pseudo.fr+".gif'>", "old", message, color);
  }
  function insereOwnMessage(pseudo, message, color, lng) {
    insereLigne(pseudo[lng]+" <img src='/res/pkmn/"+pseudo.fr+".gif'>", "own", message, color);
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


function toggleIgnore(pseudo, elt){
  if (elt !== null)
  if (ignorelist.indexOf(pseudo) == -1) {
    ignorelist.push(pseudo);
    elt.parentNode.style.color="#c0c0c0";
    elt.className="fa fa-times-circle fa-fw";
  } else {
    var i = ignorelist.indexOf(pseudo);
    ignorelist.splice(i, 1);
    elt.parentNode.style.color="black";
    elt.className="fa fa-volume-up fa-fw";
  }
  else
  if (ignorelist.indexOf(pseudo) == -1) {
    ignorelist.push(pseudo);
    updateUserList();
  } else {
    var i = ignorelist.indexOf(pseudo);
    ignorelist.splice(i, 1);
    updateUserList();
  }
}

function isCharacterKeyPress(evt) {
    if (typeof evt.which == "undefined") {
        // This is IE, which only fires keypress events for printable keys
        return true;
    } else if (typeof evt.which == "number" && evt.which > 0) {
        // In other browsers except old versions of WebKit, evt.which is
        // only greater than zero if the keypress is a printable key.
        // We need to filter out backspace and ctrl/alt/meta key combinations
        return !evt.ctrlKey && !evt.metaKey && !evt.altKey && evt.which != 8;
    }
    return false;
}

toggleMute = function() {
  for ( i = 0 ; i < 10 ; i ++) {
    if (document.getElementById("audio"+i).volume == 0 ) {
      document.getElementById("audio"+i).volume = 1;
      document.getElementById("globalMute").style.color="#fff";
      document.getElementById("globalMute").className="fa fa-volume-up fa-fw";
    } else {
      document.getElementById("audio"+i).volume = 0;
      document.getElementById("globalMute").style.color="#c0c0c0";
      document.getElementById("globalMute").className="fa fa-volume-off fa-fw";
    }
  }
}


function currentTime() {
  var currentTime = new Date();
  var hours = currentTime.getHours();
  var minutes = currentTime.getMinutes();
  var seconds = currentTime.getSeconds();
  if (minutes < 10){
    minutes = "0" + minutes;
  }
  if (seconds < 10){
    seconds = "0" + seconds;
  }
  var v = hours + ":" + minutes + ":" + seconds + " ";
  if(hours > 11){
    v+="PM";
  } else {
    v+="AM"
  }
  return v;
}

var input = document.getElementById("message");
document.onkeypress = function(evt) {
    evt = evt || window.event;
    if (isCharacterKeyPress(evt)) {
        // Do your stuff here
        if (document.getElementById("message") !== document.activeElement) document.getElementById("message").focus();
    }
}
