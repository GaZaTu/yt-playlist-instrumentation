import { TwitchAppAccessToken } from './fetchTwitchAppAccessToken';
declare const fetchTwitchStream: (userLogin: string, clientId: string, accessToken: TwitchAppAccessToken) => Promise<any>;
export default fetchTwitchStream;
export declare const isTwitchStreamLive: (userLogin: string, clientId: string, accessToken: TwitchAppAccessToken) => Promise<boolean>;
