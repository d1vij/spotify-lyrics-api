# Spotify Lyrics Api for Nodejs

A simple Node.js wrapper for fetching track lyrics from Spotify using internal endpoints.  
Lyrics can be retrieved with either a Spotify `track ID` or `track URL`.

> [!WARNING]
> This wrapper/API uses internal Spotify endpoints and may violate Spotify's Terms of Service.
> Use on your **own risk**.

> [!NOTE]
> Lyrics may not be available for free-tier accounts, even with a valid `sp_dc` cookie, due to Spotify limiting access to lyrics for them altogether.  
## Usage

1. Install and import the `SpotifyLyrics` class
```bash
npm install spotify-lyrics-api
```
```ts
import SpotifyLyricsApi from "spotify-lyrics-api"
```

2. You’ll need your Spotify `sp_dc` cookie (tied to your account). An indepth guide is provided by akashchandran [here](https://github.com/akashrchandran/syrics/wiki/Finding-sp_dc).

```ts
const my_sp_dc = "AQAcoo1dC1AhQ7eWRTeTj7FSOfrjj4tihjIhZr...";
const spotify = new SpotifyLyricsApi(my_sp_dc);
```

3. Asynchronous call to `getLyricsFromID` or `getLyricsFromURL`

```ts
const trackID = "4gMgiXfqyzZLMhsksGmbQV"; // Pink Floyd - Another Brick in the Wall
const lyrics = await spotify.getLyricsFromID(trackID);
await writeFile("another-brick-in-the-wall.json", JSON.stringify(lyrics, null, 2));

const trackURL = "https://open.spotify.com/track/5jgFfDIR6FR0gvlA56Nakr?si=8d95746b3c694281" // The Beatles - Blackbird
const lyrics2 = await spotify.getLyricsFromURL(trackURL);
await writeFile("blackbird-2.json", JSON.stringify(lyrics2, null, 2));

```

## Returned Lyrics

In most cases error is raised if lyrics for a particular track are not found.
If found, lyrics follow the `SongLyricsData` interface

```ts
interface SongLyricsData {
    lyrics: Lyrics;
    colors: Colors;
    hasVocalRemoval: boolean;
}
```

With `Lyrics` being

```ts
interface Lyrics {
    syncType: string;
    lines: LyricsLine[];
    provider: string;
    providerLyricsId: string;
    providerDisplayName: string;
    syncLyricsUri: string;
    isDenseTypeface: boolean;
    alternatives: any[];
    language: string;
    isRtlLanguage: boolean;
    capStatus: string;
    previewLines: LyricsLine[];
}
```

With `LyricsLine` being

```ts
interface LyricsLine {
    startTimeMs: string;
    words: string;
    syllables: any[];
    endTimeMs: string;
    transliteratedWords: string;
}
```

With `Colors` being
```ts
interface Colors {
    background: number;
    text: number;
    highlightText: number;
}
```


## Credits

* Based on the PHP API by [@akashrchandran](https://github.com/spotify-lyrics-api).

* [@Thereallo1026](https://github.com/Thereallo1026/spotify-secrets) for updated Spotify secrets.