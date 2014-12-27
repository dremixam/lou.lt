cat liste.txt | while read line; do
if [ ! -f "$(echo $line | tr '[:upper:]' '[:lower:]'| tr 'é' 'e' | tr 'è' 'e'| tr 'ê' 'e').gif" ]; then
    echo "$line not found"
fi
mv "$(echo $line | tr '[:upper:]' '[:lower:]'| tr 'é' 'e' | tr 'è' 'e'| tr 'ê' 'e').gif" "$line.gif"
done
