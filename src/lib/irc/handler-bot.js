"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IrcHandlerBot = exports.IrcHandlerBotRequest = void 0;
const operators_1 = require("rxjs/operators");
const handler_1 = require("./handler");
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
class IrcHandlerBotRequest {
    constructor(_event, _match, _bot) {
        this._event = _event;
        this._match = _match;
        this._bot = _bot;
    }
    async sendInsecure(msg) {
        await this._bot.sendInsecure(this.chn, msg);
    }
    async send(msg) {
        await this._bot.send(this.chn, msg);
    }
    async reply(msg) {
        await this.send(`@${this.usr} ${msg}`);
    }
    async whisper(msg) {
        await this.send(`/w ${this.usr} ${msg}`);
    }
    get usr() {
        return this._event.usr;
    }
    get chn() {
        return this._event.chn;
    }
    get msg() {
        return this._event.msg;
    }
    get tags() {
        return this._event.tags;
    }
    get match() {
        return this._match;
    }
    get bot() {
        return this._bot;
    }
}
exports.IrcHandlerBotRequest = IrcHandlerBotRequest;
class IrcHandlerBot extends handler_1.IrcHandler {
    constructor() {
        super(...arguments);
        this._tsOfLastSend = 0;
        this._messagesInWait = 0;
        this.messageQueueSize = 3;
        this.messageTimeout = 1600;
    }
    async sendInsecure(chn, msg) {
        if (this._messagesInWait >= (this.messageQueueSize - 1)) {
            return;
        }
        this._messagesInWait++;
        while (true) {
            const now = Date.now();
            const timeDiff = (now - this._tsOfLastSend);
            if (timeDiff > this.messageTimeout) {
                this._messagesInWait--;
                this._tsOfLastSend = now;
                await super.send(chn, msg);
                break;
            }
            else {
                await delay((this.messageTimeout + 1) - timeDiff);
            }
        }
    }
    async send(chn, msg) {
        if (msg.length === 0 || msg[0] === "/" || msg[0] === "." || msg[0] === "!")
            return;
        await this.sendInsecure(chn, msg);
    }
    command(regexp) {
        return this
            .on("privmsg")
            .pipe(operators_1.map(event => {
            const match = regexp.exec(event.msg);
            if (match) {
                return new IrcHandlerBotRequest(event, match, this);
            }
            else {
                return null;
            }
        }), operators_1.filter((req) => !!req));
    }
    controller(ctrl) {
        const controller = (typeof ctrl === "function") ? new ctrl() : ctrl;
        return this
            .command(controller.regexp)
            .subscribe(req => controller.run(req));
    }
    use(...fns) {
        for (const fn of fns) {
            fn(this);
        }
    }
}
exports.IrcHandlerBot = IrcHandlerBot;
