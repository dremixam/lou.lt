#!/bin/sh
#
# $1 userdata params
# $2 langue
# $3 message
# $4 voice
# $5 audio dir
#

espeak $1 -v mb/mb-${2}1 --pho "$3" 2>/dev/null | mbrola -e /usr/share/mbrola/$4/$4 - $5
