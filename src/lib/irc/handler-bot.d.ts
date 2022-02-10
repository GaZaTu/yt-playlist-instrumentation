import { Observable } from "rxjs";
import { IrcEventMap } from "./data";
import { IrcHandler } from "./handler";
interface Controller {
    regexp: RegExp;
    run: (req: IrcHandlerBotRequest) => unknown;
}
export declare class IrcHandlerBotRequest {
    private _event;
    private _match;
    private _bot;
    constructor(_event: IrcEventMap["privmsg"], _match: RegExpExecArray, _bot: IrcHandlerBot<any>);
    sendInsecure(msg: string): Promise<void>;
    send(msg: string): Promise<void>;
    reply(msg: string): Promise<void>;
    whisper(msg: string): Promise<void>;
    get usr(): string;
    get chn(): string;
    get msg(): string;
    get tags(): import("./data").IrcTags<any>;
    get match(): RegExpExecArray;
    get bot(): IrcHandlerBot<any>;
}
export declare class IrcHandlerBot<EventMap extends IrcEventMap = IrcEventMap> extends IrcHandler<EventMap> {
    private _tsOfLastSend;
    private _messagesInWait;
    messageQueueSize: number;
    messageTimeout: number;
    sendInsecure(chn: string, msg: string): Promise<void>;
    send(chn: string, msg: string): Promise<void>;
    command(regexp: RegExp): Observable<IrcHandlerBotRequest>;
    controller<TConstructor extends {
        new (): Controller;
    }>(ctrl: Controller | TConstructor): import("rxjs").Subscription;
    use(...fns: ((bot: IrcHandlerBot<any>) => unknown)[]): void;
}
export {};
