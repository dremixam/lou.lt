lou.lt
======

Code source de http://lou.lt/

Déploiement :

    git clone git@github.com:dremixam/lou.lt.git
    cd lou.lt
    npm install
    bower install

lancement :

    npm install -g forever //(si pas déja fait)
    forever start server.js

La configuration se trouve dans config.js (ip/port d'écoute, infos database etc)
