import { Observable } from "rxjs";
import { IrcEventMap, IrcEvent } from "./data";
export declare class IrcHandler<EventMap extends IrcEventMap = IrcEventMap> {
    private _callback;
    private _connect;
    private _disconnect;
    private _events;
    private _log;
    constructor(_callback: (line: string) => unknown, _connect: () => unknown, _disconnect: () => unknown);
    feed(line: string): void;
    protected sendRawLine(line: string): Promise<void>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    reconnect(): Promise<void>;
    login(nick: string, pass: string): Promise<void>;
    loginAnon(): Promise<void>;
    send(chn: string, msg: string): Promise<void>;
    whisper(usr: string, msg: string): Promise<void>;
    join(chn: string): Promise<void>;
    part(chn: string): Promise<void>;
    reqCap(name: string): Promise<void>;
    on<K extends IrcEvent["event"]>(event: K): Observable<EventMap[K]>;
    once<K extends IrcEvent["event"]>(event: K): Promise<EventMap[K]>;
    get events(): Observable<EventMap[keyof EventMap]>;
    get log(): (line: any, io: "in" | "out") => void;
    set log(value: (line: any, io: "in" | "out") => void);
}
