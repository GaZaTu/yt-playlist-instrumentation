"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IrcHandler = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const data_1 = require("./data");
const parser_1 = require("./parser");
class IrcHandler {
    constructor(_callback, _connect, _disconnect) {
        this._callback = _callback;
        this._connect = _connect;
        this._disconnect = _disconnect;
        this._events = new rxjs_1.Subject();
        this._log = (line, io) => { };
        this.on("ping")
            .subscribe(({ src }) => this.sendRawLine(`PONG :${src}`));
        this.on("reconnect")
            .subscribe(() => this.reconnect());
    }
    feed(line) {
        const lineAndTags = parser_1.lineToLineAndTags(line);
        const ircEvent = parser_1.lineAndTagsToIrcEvent(lineAndTags);
        this._log(line, "in");
        this._events.next(ircEvent);
    }
    async sendRawLine(line) {
        this._log(line, "out");
        await this._callback(line);
    }
    async connect() {
        await this._connect();
        this._events.next({
            event: "connect",
        });
    }
    async disconnect() {
        await this._disconnect();
        this._events.next({
            event: "disconnect",
        });
    }
    async reconnect() {
        await this.disconnect();
        await this.connect();
    }
    async login(nick, pass) {
        await this.sendRawLine(`PASS ${pass}`);
        await this.sendRawLine(`NICK ${nick}`);
    }
    async loginAnon() {
        throw new Error("unsupported operation");
    }
    async send(chn, msg) {
        await this.sendRawLine(`PRIVMSG #${chn} :${msg}`);
    }
    async whisper(usr, msg) {
        throw new Error("unsupported operation");
    }
    async join(chn) {
        await this.sendRawLine(`JOIN #${chn}`);
    }
    async part(chn) {
        await this.sendRawLine(`PART #${chn}`);
    }
    async reqCap(name) {
        await this.sendRawLine(`CAP REQ ${name}`);
    }
    on(event) {
        return this._events
            .pipe(operators_1.filter(data_1.ircEventIs(event)));
    }
    once(event) {
        return this.on(event)
            .pipe(operators_1.first())
            .toPromise();
    }
    get events() {
        return this._events.asObservable();
    }
    get log() {
        return this._log;
    }
    set log(value) {
        this._log = value;
    }
}
exports.IrcHandler = IrcHandler;
