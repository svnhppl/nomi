Nomi GitHub Version 2.2.9

This ZIP contains the start screen icon update.

Basis:
- Keeps the compact, larger Orbs behavior.
- Keeps the current Prepare behavior: Prepare contracts to the smallest state and meditation starts with Inhale.
- Uses the existing CSS file style_v224.css unchanged.

What changed:
- Settings is no longer shown as text above the graphic.
- Settings and Share are now centered as two icons in one row below Start.
- The icon style follows the uploaded direction: bold geometric bars, circles and share nodes.
- The icons use the current Nomi theme accent color via CSS currentColor.
- Settings is shown with higher opacity.
- Share is intentionally softer/lower opacity because it is the least important action.

Important:
This ZIP does not include MP3 files and does not include a new external CSS file.
Keep these files unchanged on GitHub:
- style_v224.css
- einatmen.mp3
- ausatmen.mp3
- ende.mp3

Upload these files to the GitHub repository root and overwrite where GitHub asks.
The new index.html now uses:
- app_v229.js
- style_v224.css
