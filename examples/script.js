import { writeFile } from "fs/promises";
import { SpotifyLyrics } from "../src/SpotifyLyrics.js";

const sp_dc = "AQBfMB990COERTK1UjZ1bZ4jzl-v8IVIuhry1JHkVhp9h1-WjAU6X8hFWAn8asQ0jWFz95nfIreY0180oGabtYn6EOjlhQl-0_uf4YSYtMm7kiUWIElrlonii6zl1L2gRAAoClv9InPpegnALvJ_nM4abRvcz7ulC5l9SSZ4BQk1LjgXhGDWaIUH-Anmuyntg-dD0zBcRj_oxhiF-7mQAYz8sdlNL_4fX1VOwmKzc4oDH9zGNEoh6Q-8iTX4Z0Qe7Efn5tKczsNVGGI";
const trackID = "4gMgiXfqyzZLMhsksGmbQV"

async function main() {
    const spotify = new SpotifyLyrics(sp_dc);
    const lyrics = await spotify.getLyricsFor(trackID);
    console.log(lyrics);
    await writeFile("lyrics.json", JSON.stringify(lyrics), {encoding:"utf-8"});
}

main().catch(console.log);