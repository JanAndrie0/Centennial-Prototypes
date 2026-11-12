@echo off
REM Downloads the background music and sound effects (from Openverse) for the Centennial demo video.
REM Files are saved in the "demo-audio" folder next to this script.
setlocal
set "OUT=%~dp0demo-audio"
if not exist "%OUT%" mkdir "%OUT%"
set "UA=CentennialDemoVideo/1.0 (UE BSIT capstone project)"
echo Downloading demo audio into %OUT% ...

REM ---- Background music (3 options) ----
curl -sSL -A "%UA%" -o "%OUT%\music-1-soft-corporate.ogg"      "https://upload.wikimedia.org/wikipedia/commons/5/5f/Soft_Corporate_by_MusicLFiles.ogg"
curl -sSL -A "%UA%" -o "%OUT%\music-2-inspiring-corporate.mp3" "https://prod-1.storage.jamendo.com/?trackid=1670484&format=mp32"
curl -sSL -A "%UA%" -o "%OUT%\music-3-inspired-macleod.mp3"    "https://upload.wikimedia.org/wikipedia/commons/a/a1/Inspired_%%28ISRC_USUAN1600022%%29.mp3"

REM ---- Sound effects ----
curl -sSL -A "%UA%" -o "%OUT%\sfx-ui-click.mp3"        "https://cdn.freesound.org/previews/467/467951_6769414-hq.mp3"
curl -sSL -A "%UA%" -o "%OUT%\sfx-mouse-click.mp3"     "https://cdn.freesound.org/previews/347/347544_5662401-hq.mp3"
curl -sSL -A "%UA%" -o "%OUT%\sfx-whoosh.mp3"          "https://cdn.freesound.org/previews/60/60026_71257-hq.mp3"
curl -sSL -A "%UA%" -o "%OUT%\sfx-whoosh-deep.mp3"     "https://cdn.freesound.org/previews/351/351256_2247456-hq.mp3"
curl -sSL -A "%UA%" -o "%OUT%\sfx-success-ping.mp3"    "https://cdn.freesound.org/previews/215/215415_1038806-hq.mp3"
curl -sSL -A "%UA%" -o "%OUT%\sfx-alert.mp3"           "https://cdn.freesound.org/previews/657/657948_6142149-hq.mp3"
curl -sSL -A "%UA%" -o "%OUT%\sfx-pop.mp3"             "https://cdn.freesound.org/previews/669/669921_9129912-hq.mp3"
curl -sSL -A "%UA%" -o "%OUT%\sfx-camera-shutter.mp3"  "https://cdn.freesound.org/previews/170/170229_3133582-hq.mp3"
curl -sSL -A "%UA%" -o "%OUT%\sfx-printer.mp3"         "https://cdn.freesound.org/previews/595/595071_12596087-hq.mp3"
curl -sSL -A "%UA%" -o "%OUT%\sfx-truck-start.mp3"     "https://cdn.freesound.org/previews/455/455736_612689-hq.mp3"
curl -sSL -A "%UA%" -o "%OUT%\sfx-typing.mp3"          "https://cdn.freesound.org/previews/379/379418_6207707-hq.mp3"
curl -sSL -A "%UA%" -o "%OUT%\sfx-cash-register.mp3"   "https://cdn.freesound.org/previews/721/721774_15555277-hq.mp3"

REM ---- Narration (Justin Case, ElevenLabs) - links expire about 3 hours after they were made ----
curl -sSL -A "%UA%" -o "%OUT%\narr-S02.mp3"        "https://elevenlabsusercontent.com/database/workspace/08daa3da2d8947c1ab8bda35147e656c/content_generation/HTRGvYnWlaQuBgHSip0g/sVs7saHoC8mKRIP4sB3v/content.mp3?Expires=1794142800&KeyName=assets-cdn-key-1&Signature=GB7_IfL3jd_DVYWjK64Kmena-pk="
curl -sSL -A "%UA%" -o "%OUT%\narr-rest-take1.mp3" "https://elevenlabsusercontent.com/database/workspace/08daa3da2d8947c1ab8bda35147e656c/content_generation/uuLtByZ4B8jss903v7am/RdniSTRebVpPwcZ90sJI/content.mp3?Expires=1794146400&KeyName=assets-cdn-key-1&Signature=5kZusYZzsvVG-75nbSOBV3NJ-q4="
curl -sSL -A "%UA%" -o "%OUT%\narr-rest-take2.mp3" "https://elevenlabsusercontent.com/database/workspace/08daa3da2d8947c1ab8bda35147e656c/content_generation/kCU3aiSM29iJWscAQr7l/JNgImQfTT5QKyYEReeD9/content.mp3?Expires=1794146400&KeyName=assets-cdn-key-1&Signature=o8J0RG4RK0CuwGAYYVbMqbhDxTQ="

echo.
dir /b "%OUT%"
echo.
echo Done. Tell Claude the files are ready.
pause
