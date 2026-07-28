Nomi Version 1.0.12

GitHub Pages web build.

Changes in 1.0.12:
1. Audio loading now works on GitHub Pages because app.js uses relative URLs like ./einatmen.mp3 instead of chrome.runtime.getURL().
2. The app no longer depends on the Chrome extension runtime when opened as a website.
3. If an audio file cannot be loaded or decoded, Nomi uses a generated fallback tone so the site still has sound.
4. You can replace the included placeholder files with real MP3 files using exactly these file names: einatmen.mp3, ausatmen.mp3, ende.mp3.

Upload the contents of this ZIP directly into the GitHub repository root. Do not upload the ZIP itself.

Files:
- manifest.json
- background.js
- index.html
- style.css
- app.js
- einatmen.mp3
- ausatmen.mp3
- ende.mp3
- icon.png
- icon16.png
- icon48.png
- icon128.png
- README.txt
