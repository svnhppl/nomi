Nomi GitHub Version 2.0.2

This ZIP is for the GitHub Pages version only.

What changed:
- iPhone audio handling was changed again: audio elements are now created once and reused.
- Nomi no longer creates a new Audio object for every inhale/exhale phase.
- Fallback tones remain removed.
- Nomi only plays the actual audio files:
  - einatmen.mp3
  - ausatmen.mp3
  - ende.mp3
- The Settings link is centered so it cannot be cut off at the right edge on iPhone.
- The Start button is now proportional to the word and no longer full-width.
- Small-screen start layout remains vertically centered.
- The settings modal, saved user settings, optional fullscreen, and three themes remain unchanged.

Important:
This ZIP does not include MP3 files so your existing sounds on GitHub are not overwritten.
Keep these files unchanged:
- einatmen.mp3
- ausatmen.mp3
- ende.mp3

Upload all files from this ZIP into the GitHub repository root and overwrite existing files where GitHub asks.
The new index.html now uses:
- app_v202.js
- style_v202.css
