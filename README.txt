Nomi GitHub Version 2.2.4

This ZIP contains the GitHub Pages version.

Basis:
- Continues from v2.2.3.
- No design changes to the start screen, Settings popup, meditation layout, animation, audio, Wake Lock or auto-return.

What changed:
- Bugfix: "Prepare" no longer remains visible after the preparation phase.
- The numeric countdown remains removed.
- During Prepare, only the word "Prepare" gently fades out.
- When the meditation begins, the Prepare element is explicitly hidden so it cannot reappear during Inhale/Exhale.

Important:
This ZIP does not include MP3 files so your existing sounds on GitHub are not overwritten.
Keep these files unchanged:
- einatmen.mp3
- ausatmen.mp3
- ende.mp3

Upload all files from this ZIP into the GitHub repository root and overwrite existing files where GitHub asks.
The new index.html now uses:
- app_v224.js
- style_v224.css
