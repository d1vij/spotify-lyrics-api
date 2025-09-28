import crypto from "crypto";
import { IAccessToken, ISecretKey, IServerTimeParams, Lyrics } from "../typings";





export class SpotifyLyrics {

    // Gives the current epoch time of spotify server -> {serverTime":1759060399}
    private serverTimeUrl = "https://open.spotify.com/api/server-time";

    // Returns the token required for sending request for lyrics
    private tokenUrl = "https://open.spotify.com/api/token";

    // Returns the lyrics data;
    private lyricsUrl = "https://spclient.wg.spotify.com/color-lyrics/v2/track/";

    // Latest spotify secrets
    private secretKeyUrl = "https://raw.githubusercontent.com/Thereallo1026/spotify-secrets/refs/heads/main/secrets/secrets.json";
    private sp_dc: string;

    private cachedToken: IAccessToken | undefined;
    
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

    private generateTimeBasedOTP(serverTimeMs: number, secret: string) {
        // Generates a TOTP based on sha1 algorithm
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

        const { version, secret } = await this.getLatestSecretKey();
        const transformed = this.transformSecretKey(secret);

        const totp = this.generateTimeBasedOTP(serverTime, transformed);
        const currTime = Date.now().toString();
        return {
            "reason": "transport",
            "productType": "web-player",
            "totp": totp,
            "totpVer": version,
            "ts": currTime
        }
    }

    private async getAccessToken(): Promise<IAccessToken> {
        const params = await this.generateServerTimeParams();
        const url = this.buildQueryUrl(this.tokenUrl, params);
        console.log(`Token url `, url);

        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Cookie": `sp_dc=${this.sp_dc}`
            },
        })

        const json = await response.json();
        if (json["isAnonymous"] === undefined || json["isAnonymous"] === true) throw new Error("SP_DC passed is invalid");
        return json;
    }

    private async validateAccessToken(){
        if(this.cachedToken === undefined){
            this.cachedToken = await this.getAccessToken();
            return;
        }
        if(this.cachedToken.accessTokenExpirationTimestampMs >= Date.now().toString()){
            this.cachedToken = await this.getAccessToken();
            return;
        }
    }
    
    public async getLyricsFor(trackId:string): Promise<Lyrics>{
        await this.validateAccessToken();

        const url = `${this.lyricsUrl}${trackId}?format=json&market=from_token`;
        const response = await fetch(url, {
            headers :{
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Safari/537.36",
                "App-platform": "WebPlayer",
                "authorization": `Bearer ${this.cachedToken?.accessToken}`
            }
        })
        const json = await response.json();
        return json;
    }
}