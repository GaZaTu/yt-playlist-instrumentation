import { IrcHandlerBot } from "../irc/handler-bot";
import { TwitchIrcEventMap } from "./irc-data";
export declare class TwitchIrcBot extends IrcHandlerBot<TwitchIrcEventMap> {
    private _wsUrl;
    private _webSocket?;
    private _webSocketOnMessage;
    constructor(_wsUrl?: string);
    loginAnon(): Promise<void>;
    whisper(usr: string, msg: string): Promise<void>;
    reqCap(name: "commands" | "membership" | "tags"): Promise<void>;
    private handleCallback;
    private handleConnect;
    private handleDisconnect;
}
