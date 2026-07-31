Nomi GitHub Version 2.2.8

This ZIP contains a revised Orbs animation test.

Basis:
- Continues the v2.2.6 transition behavior: Prepare contracts to minimum exhale and the meditation starts with Inhale.
- Uses the existing CSS file style_v224.css unchanged.
- No changes to Settings popup design, start screen design, audio files, Wake Lock or auto-return behavior.

What changed:
- The prior central Orb approach was removed.
- Orbs mode now uses the original 8 Orbs again.
- The Orbs are more compact, especially near the minimum/exhale state.
- The Orbs are larger, so the inner overlaps close the visible donut-like hole more naturally.

Technical direction:
- minimum radial distance reduced
- orb scaling increased
- outer expansion still retained for breathing movement

Important:
This ZIP does not include MP3 files and does not include a new CSS file.
Keep these files unchanged on GitHub:
- style_v224.css
- einatmen.mp3
- ausatmen.mp3
- ende.mp3

Upload these files to the GitHub repository root and overwrite where GitHub asks.
The new index.html now uses:
- app_v228.js
- style_v224.css
