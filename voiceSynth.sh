#!/bin/sh
#
# $1 userdata params
# $2 langue
# $3 message
# $4 voice
# $5 audio dir
# $6 gender
#

echo espeak $1 -z -v mb/mb-${2}${6} --pho "$3" 2>/dev/null | mbrola -e /usr/share/mbrola/$4/$4 - $5
espeak $1 -z -v mb/mb-${2}${6} --pho "$3" 2>/dev/null | mbrola -e /usr/share/mbrola/$4/$4 - $5
