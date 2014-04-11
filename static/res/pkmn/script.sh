for line in $(cat liste.txt);
do echo $line | tr '[:upper:]' '[:lower:]' ; 
wget http://www.tloa.fr/pokedex/images/pokemon/icone/$(echo $line | tr '[:upper:]' '[:lower:]').gif
done  
