lou.lt
======

Code source de http://lou.lt/

Dépendances :
    
    sudo apt-get install nodejs npm mongodb ruby-full rubygems1.8 espeak mbrola mbrola-fr* mbrola-en*
    sudo npm install -g forever
    sudo npm install -g gulp
    sudo gem install sass
    sudo gem install compass

Déploiement :

    git clone git@github.com:dremixam/lou.lt.git
    cd lou.lt
    npm install
    gulp

Utilisation en mode développement :

    npm install --dev
    gulp devel

Lancement en exploitation :

    forever start server.js

La configuration se trouve dans config.json (exemple donné dans config.example.json, ip/port d'écoute, infos database etc)
