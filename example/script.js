import { writeFile } from "fs/promises";
import { SpotifyLyricsApi } from "../dist/SpotifyLyrics.js";

const sp_dc = "AQCXF63kEYCrHqKEah2ZlHl-...";

// Example tracks
const trackID = "4gMgiXfqyzZLMhsksGmbQV"; 
const trackUrl = "https://open.spotify.com/track/49MHCPzvMLXhRjDantBMVH";
const trackUrl2 = "https://open.spotify.com/track/5jgFfDIR6FR0gvlA56Nakr?si=8d95746b3c694281";

async function main() {
    const spotify = new SpotifyLyricsApi(sp_dc);

    
    try{
        const lyrics1 = await spotify.getLyricsFromID(trackID);
        await writeFile("another-brick-in-the-wall.json", JSON.stringify(lyrics1, null, 2));
    } catch(e) {console.log(e)};

    try{
        const lyrics2 = await spotify.getLyricsFromURL(trackUrl2);
        await writeFile("blackbird.json", JSON.stringify(lyrics2, null, 2));
    } catch(e) {console.log(e)};

    try{
        const lyrics3 = await spotify.getLyricsFromURL(trackUrl);
        await writeFile("just-the-way-you-are.json", JSON.stringify(lyrics3, null, 2));
    } catch(e) {console.log(e)};

    try{
        const lyrics4 = await spotify.getLyricsFromID("3z8h0TU7ReDPLIbEnYhWZb");
        await writeFile("bohemian-rhapsody.json", JSON.stringify(lyrics4, null, 2));
    } catch(e) {console.log(e)};
}

main().catch(console.error);
