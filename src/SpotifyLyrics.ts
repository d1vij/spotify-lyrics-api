import crypto from "crypto";
import {
    IAccessToken,
    ISecretKey,
    IServerTimeParams,
    Lyrics
} from "../typings.js";

export default class SpotifyLyricsApi {

    /**
     * Latest Spotify Secrets
    */
    private secretKeyUrl = "https://raw.githubusercontent.com/Thereallo1026/spotify-secrets/refs/heads/main/secrets/secrets.json";

    /**
     * Returns the current epoch time of spotify's server -> {serverTime":1759060399}
     * Used for generating time based SHA-1 TOTP which is used to generate the Access Token
     * required for requesting Lyrics.
     */
    private serverTimeUrl = "https://open.spotify.com/api/server-time";


    /**
     *  Endpoint for requesting Access Token.
     * */
    private tokenUrl = "https://open.spotify.com/api/token";


    /**
     * Endpoint for requesting the track lyrics
     */
    private lyricsUrl = "https://spclient.wg.spotify.com/color-lyrics/v2/track/";

    /**
     * User's sp_dc token. 
     * By using this we basically trick the spotify's api into thinking
     * that it is the User's client which is sending the request.
     */
    private sp_dc: string;

    /**
     * Caching the token for inbetween requests.
     */
    private cachedToken: IAccessToken | undefined;

    private secret: string | undefined;
    private version: string | undefined;

    constructor(sp_dc: string) {
        this.sp_dc = sp_dc;
    }

    private buildQueryUrl(baseUrl: string, queryParams: Record<string, any>) {
        const params = [];
        for (const [key, value] of Object.entries(queryParams)) {
            params.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
        };
        return baseUrl + "?" + params.join("&");
    }

    /**
     * Fetching the latest spotify secret key from @Thereallo1026 's repo
     */
    private async getLatestSecretKey(): Promise<ISecretKey> {
        const response = await fetch(this.secretKeyUrl);
        const secretKeyObj = await response.json();
        if (Array.isArray(secretKeyObj) === false) throw new Error("Secret key Response is not an array");

        // Last one would be the latest
        return secretKeyObj.at(-1);
    }

    private transformSecretKey(secret: string): string {
        const characters = [...secret];
        const ascii_codes = characters.map(ch => ch.charCodeAt(0));

        const transformed = ascii_codes.map((ass, idx) => ass ^ ((idx % 33) + 9));
        return transformed.join('');
    }

    /**
     * Generates a 6 digit time based OTP (totp)
     */
    private generateTimeBasedOTP(serverTimeMs: number, secret: string) {
        const period = 30;
        const digits = 6;

        const count = Math.floor(serverTimeMs / period);

        const counterBuffer = Buffer.alloc(8);

        counterBuffer.writeUint32BE(Math.floor(count / Math.pow(2, 32)), 0);
        counterBuffer.writeUint32BE(count >>> 0, 4);

        const hmac = crypto.createHmac("sha1", secret).update(counterBuffer).digest();

        if (hmac.at(-1) === undefined) throw new Error("HMAC[-1] is undefined");
        const offset = hmac.at(-1)! & 0x0f;
        const binary = ((hmac[offset] & 0x7f) << 24) |
            ((hmac[offset + 1] & 0xff) << 16) |
            ((hmac[offset + 2] & 0xff) << 8) |
            (hmac[offset + 3] & 0xff);

        const otp = (binary % Math.pow(10, digits)).toString().padStart(digits, "0");
        return otp;
    }

    private async generateServerTimeParams(): Promise<IServerTimeParams> {
        const response = await fetch(this.serverTimeUrl);
        const serverTime = (await response.json())['serverTime'];

        if (serverTime === undefined) throw new Error("Server Time is undefined");

        // Caching Version and Secret for this runtime.
        if (this.version === undefined || this.secret === undefined) {
            const { version, secret } = await this.getLatestSecretKey();
            this.version = version;
            this.secret = this.transformSecretKey(secret);
        }

        const totp = this.generateTimeBasedOTP(serverTime, this.secret);
        const currTime = Date.now().toString();
        return {
            "reason": "transport",
            "productType": "web-player",
            "totp": totp,
            "totpVer": this.version,
            "ts": currTime
        }
    }

    private async getAccessToken(): Promise<IAccessToken> {
        const params = await this.generateServerTimeParams();
        const url = this.buildQueryUrl(this.tokenUrl, params);

        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Cookie": `sp_dc=${this.sp_dc}`
            },
        })

        const accessTokenObj = await response.json();

        if (accessTokenObj["isAnonymous"] === undefined
            || accessTokenObj["isAnonymous"] === true) throw new Error("SP_DC passed is invalid");

        return accessTokenObj;
    }

    // Caching accesss token
    private async validateAccessToken() {
        if (this.cachedToken === undefined) {
            this.cachedToken = await this.getAccessToken();
            return;
        }
        if (parseInt(this.cachedToken.accessTokenExpirationTimestampMs) >= Date.now()) {
            this.cachedToken = await this.getAccessToken();
            return;
        }
    }

    public async getLyricsFromID(trackId: string): Promise<Lyrics> {
        await this.validateAccessToken();

        const url = `${this.lyricsUrl}${trackId}?format=json&market=from_token`;
        const response = await fetch(url, {
            headers: {
                // Spotify's server thinks we are sending a genuine request from browser's web player
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Safari/537.36",
                "App-platform": "WebPlayer",
                "authorization": `Bearer ${this.cachedToken?.accessToken}`
            }
        })
        if (response.ok === false || response.status === 404)
            throw new Error(`Error in fetching lyrics, Status Code returned ${response.status}, Status Text returned ${response.statusText}`);

        const lyricsResponseObj = await response.json();
        return lyricsResponseObj;
    }
    
    public async getLyricsFromURL(trackUrl: string): Promise<Lyrics> {
        const regex = /^(?:https?:\/\/)?open\.spotify\.com\/track\/([^?\/]+)/;
        const results = regex.exec(trackUrl);
        if (results === null) throw new Error("Error in parsing track url " + trackUrl);
        const trackId = results[1];
        if (trackId === undefined) throw new Error("Error in parsing track url " + trackUrl);
        return this.getLyricsFromID(trackId);
    }
}