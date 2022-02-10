"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lineAndTagsToIrcEvent = exports.lineToLineAndTags = exports.parseIrcEvent = exports.parseReconnect = exports.parseRoomstate = exports.parseUserstate = exports.parseUsernotice = exports.parseClearchat = exports.parsePing = exports.parsePrivmsg = exports.parseTags = exports.fillTagsMap = void 0;
function fillTagsMap(tags, line, start, end) {
    let key = "";
    let value = "";
    let valueAsNumber = 0;
    let lastI = start;
    for (let i = lastI; i < end; i++) {
        switch (line[i]) {
            case "=":
                key = line.slice(lastI, i);
                lastI = i + 1;
                break;
            case ";":
            case " ":
                value = line.slice(lastI, i);
                valueAsNumber = Number(value);
                tags.set(key, isNaN(valueAsNumber) ? value.replace(/\\s/g, " ") : valueAsNumber);
                lastI = i + 1;
                break;
        }
    }
}
exports.fillTagsMap = fillTagsMap;
function parseTags(line) {
    let tags = new Map();
    if (line[0] === "@") {
        const indexOfTagsEnd = line.indexOf(" ") + 1;
        tags = new Proxy(tags, {
            get: (tags, p) => {
                if (tags.size === 0) {
                    fillTagsMap(tags, line, 1, indexOfTagsEnd);
                }
                if (typeof tags[p] === "function") {
                    return tags[p].bind(tags);
                }
                else {
                    return tags[p];
                }
            },
        });
        return [line.slice(indexOfTagsEnd), tags];
    }
    return [line, tags];
}
exports.parseTags = parseTags;
function parsePrivmsg(line, tags) {
    const regex = /:(\w+)!\w+@\S+ PRIVMSG #(\w+) :/;
    const match = regex.exec(line);
    if (match) {
        return {
            event: "privmsg",
            usr: match[1],
            chn: match[2],
            msg: line.slice(match[0].length),
            tags: tags,
        };
    }
    else {
        return null;
    }
}
exports.parsePrivmsg = parsePrivmsg;
function parsePing(line) {
    const regex = /PING :(.*)/;
    const match = regex.exec(line);
    if (match) {
        return {
            event: "ping",
            src: match[1],
        };
    }
    else {
        return null;
    }
}
exports.parsePing = parsePing;
function parseClearchat(line, tags) {
    const regex = /:\S+ CLEARCHAT #(\w+) :(\w+)/;
    const match = regex.exec(line);
    if (match) {
        return {
            event: "clearchat",
            usr: match[2],
            chn: match[1],
            tags: tags,
        };
    }
    else {
        return null;
    }
}
exports.parseClearchat = parseClearchat;
function parseUsernotice(line, tags) {
    const regex = /:\S+ USERNOTICE #(\w+)/;
    const match = regex.exec(line);
    if (match) {
        return {
            event: "usernotice",
            chn: match[1],
            tags: tags,
        };
    }
    else {
        return null;
    }
}
exports.parseUsernotice = parseUsernotice;
function parseUserstate(line, tags) {
    const regex = /:\S+ USERSTATE #(\w+)/;
    const match = regex.exec(line);
    if (match) {
        return {
            event: "userstate",
            chn: match[1],
            tags: tags,
        };
    }
    else {
        return null;
    }
}
exports.parseUserstate = parseUserstate;
function parseRoomstate(line, tags) {
    const regex = /:\S+ ROOMSTATE #(\w+)/;
    const match = regex.exec(line);
    if (match) {
        return {
            event: "roomstate",
            chn: match[1],
            tags: tags,
        };
    }
    else {
        return null;
    }
}
exports.parseRoomstate = parseRoomstate;
function parseReconnect(line) {
    if (line.includes("RECONNECT")) {
        return {
            event: "reconnect",
        };
    }
    else {
        return null;
    }
}
exports.parseReconnect = parseReconnect;
function parseIrcEvent(line, tags) {
    const parsers = [
        parsePrivmsg,
        parsePing,
        parseClearchat,
        parseUsernotice,
        parseUserstate,
        parseRoomstate,
        parseReconnect,
    ];
    for (const parser of parsers) {
        const event = parser(line, tags);
        if (event) {
            return event;
        }
    }
    return {
        event: "unknown",
        line,
        tags,
    };
}
exports.parseIrcEvent = parseIrcEvent;
function lineToLineAndTags(line) {
    return parseTags(line);
}
exports.lineToLineAndTags = lineToLineAndTags;
function lineAndTagsToIrcEvent([line, tags]) {
    return parseIrcEvent(line, tags);
}
exports.lineAndTagsToIrcEvent = lineAndTagsToIrcEvent;
