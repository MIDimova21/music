CattyBoard - Local Music App

Open index.html in a modern browser (Chrome, Edge, Firefox). The app uses IndexedDB to store tracks (cover images and audio) locally in your browser.

How to use:
- Click "＋ Add song" to open the form. Provide a title, optional artist, a cover image (optional), and an audio file (MP3, OGG, etc).
- Click Add. The track is saved locally and appears in the list.
- Use the play buttons to play a single track, or Play all to play from top.
- The footer player shows cover art, title, artist, and playback controls.

Files:
- index.html - main UI
- styles.css - styling
- app.js - logic, IndexedDB interactions

Notes:
- Files are stored in IndexedDB in the browser; they do not get saved as files on disk.
- For local file access in Chrome, you may need to serve the folder via a simple static server. Alternatively, open index.html directly in Edge or Firefox which allow IndexedDB for file:// in many cases.

Location: c:\Users\MIDimova21\musics
