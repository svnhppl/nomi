Nomi GitHub Version 2.2.7

This ZIP contains the corrected implementation for Orbs with a real central orb.

Basis:
- Continues the v2.2.6 transition behavior: Prepare contracts to minimum exhale and the meditation starts with Inhale.
- Uses the existing CSS file style_v224.css unchanged.
- No changes to Settings popup design, start screen design, audio files, Wake Lock or auto-return behavior.

What changed:
- In Orbs mode, the animation now creates 8 outer Orbs plus 1 dedicated central Orb.
- The central Orb has its own class: center-orb.
- The central Orb does not move radially outward.
- The central Orb stays exactly in the center and scales only slightly with the breathing phase.
- This is intended to reduce or remove the visible donut-shaped hole during exhale.

Important:
This ZIP does not include MP3 files and does not include a new CSS file.
Keep these files unchanged on GitHub:
- style_v224.css
- einatmen.mp3
- ausatmen.mp3
- ende.mp3

Upload these files to the GitHub repository root and overwrite where GitHub asks.
The new index.html now uses:
- app_v227.js
- style_v224.css
