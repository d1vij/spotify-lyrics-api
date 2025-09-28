export interface ISecretKey {
    version: string,
    secret: string
}
export interface IServerTimeParams {
    reason: string,
    productType: string,
    totp: string,
    totpVer: number | string,
    ts: string | string,
}

export interface IAccessToken {
    clientId: string,
    accessToken: string,
    accessTokenExpirationTimestampMs: string,
    isAnonymous: boolean,
    _notes: string | 'Usage of this endpoint is not permitted under the Spotify Developer Terms and Developer Policy, and applicable law'
}

export interface LyricsLine {
    startTimeMs: string;
    words: string;
    syllables: any[];
    endTimeMs: string;
    transliteratedWords: string;
}

export interface Lyrics {
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

export interface Colors {
    background: number;
    text: number;
    highlightText: number;
}

export interface SongLyricsData {
    lyrics: Lyrics;
    colors: Colors;
    hasVocalRemoval: boolean;
}

export default class SpotifyLyricsApi {
    constructor(sp_dc:string);
    public async getLyricsFromID(trackId: string): Promise<Lyrics>;
    public async getLyricsFromURL(trackId: string): Promise<Lyrics>;
}