Nomi GitHub Version 2.0.1

This ZIP is for the GitHub Pages version only.

What changed:
- Fallback tones have been completely removed.
- The code no longer contains AudioContext/Oscillator fallback generation.
- Nomi now only tries to play the actual audio files:
  - einatmen.mp3
  - ausatmen.mp3
  - ende.mp3
- If one of these files cannot be played, Nomi will stay silent for that sound instead of generating a synthetic tone.
- The simplified start screen, settings modal, saved user settings, optional fullscreen, and three themes remain unchanged.
- The app UI remains English.
- The share email text remains German.

Important:
This ZIP does not include MP3 files so your existing sounds on GitHub are not overwritten.
Keep these files in your repository unchanged:
- einatmen.mp3
- ausatmen.mp3
- ende.mp3

Upload all files from this ZIP into the GitHub repository root and overwrite existing files where GitHub asks.
The new index.html now uses:
- app_v201.js
- style_v201.css
