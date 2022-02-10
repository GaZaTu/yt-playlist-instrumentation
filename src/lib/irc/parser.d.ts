import { IrcTags, IrcEvent, IrcEventMap } from "./data";
export declare function fillTagsMap(tags: IrcTags, line: string, start: number, end: number): void;
export declare function parseTags(line: string): [string, IrcTags];
export declare function parsePrivmsg(line: string, tags: IrcTags): IrcEventMap["privmsg"] | null;
export declare function parsePing(line: string): IrcEventMap["ping"] | null;
export declare function parseClearchat(line: string, tags: IrcTags): IrcEventMap["clearchat"] | null;
export declare function parseUsernotice(line: string, tags: IrcTags): IrcEventMap["usernotice"] | null;
export declare function parseUserstate(line: string, tags: IrcTags): IrcEventMap["userstate"] | null;
export declare function parseRoomstate(line: string, tags: IrcTags): IrcEventMap["roomstate"] | null;
export declare function parseReconnect(line: string): IrcEventMap["reconnect"] | null;
export declare function parseIrcEvent(line: string, tags: IrcTags): IrcEvent;
export declare function lineToLineAndTags(line: string): [string, IrcTags<{
    [key: string]: any;
}>];
export declare function lineAndTagsToIrcEvent([line, tags]: [string, IrcTags]): IrcEvent;
