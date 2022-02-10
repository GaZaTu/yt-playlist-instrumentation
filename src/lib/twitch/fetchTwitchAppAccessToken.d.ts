export declare class TwitchAppAccessToken {
    private _jsonData;
    constructor(_jsonData: any);
    get accessToken(): string;
    get refreshToken(): string | undefined;
    get expiresIn(): number;
    get scope(): string[] | undefined;
    get tokenType(): string;
    get asAuthorizationHeader(): string;
}
declare const fetchTwitchAppAccessToken: (clientId: string, clientSecret: string, grantType?: string) => Promise<TwitchAppAccessToken>;
export default fetchTwitchAppAccessToken;
