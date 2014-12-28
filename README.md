lou.lt
======

Code source de http://lou.lt/

Dépendances système :

- nodejs
- gulp
- compass
- imagemagick
- espeak
- mbrola
- forever

Déploiement :

    git clone git@github.com:dremixam/lou.lt.git
    cd lou.lt
    npm install
    gulp

lancement :

    forever start server.js

La configuration se trouve dans config.js (ip/port d'écoute, infos database etc)
