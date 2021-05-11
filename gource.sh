#!/bin/sh
gource \
gource.txt \
-f \
--auto-skip-seconds 1 \
--date-format "%A, %d %B, %Y" \
--seconds-per-day 1 \
--file-idle-time 0 \
--key \
--logo ./app/src/notcordsmall.png \
--title "NotCord App Development" \
--user-image-dir avatars/