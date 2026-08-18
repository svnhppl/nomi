Nomi Web & PWA Update Pack (v2.3.0 Clean Architecture Release)

Inhalt:
1. index.html (Bereinigte Struktur mit 3er-Toolbar: Info [i], Einstellungen, Teilen)
2. app_v230.js (Vollständig bereinigtes State-Management, robuste Audio-Fallbacks, sofortiger Reset bei 'End' & synchronisiertes Start-Screen-Rendering)
3. background.js
4. manifest.json
5. README.txt

Wichtigste Verbesserungen & Bereinigungen:
- Vollständiger State-Reset bei Klick auf "End" oder Session-Abschluss (keine hängenden AnimationFrames oder Timer mehr).
- Robuste Fallbacks für Audio-Abschluss: Die App kehrt garantiert nach jeder Session zum Startbildschirm zurück, auch wenn Töne blockiert oder stumm sind.
- 100%ige Synchronisation zwischen statischem HTML und dynamischem JavaScript-Rendering.
- Zentrierte, harmonische Skalierung für Desktop- und Mobile-Displays.
