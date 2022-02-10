"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitchIrcBot = void 0;
const WebSocket = require("ws");
const handler_bot_1 = require("../irc/handler-bot");
class TwitchIrcBot extends handler_bot_1.IrcHandlerBot {
    constructor(_wsUrl = "wss://irc-ws.chat.twitch.tv/") {
        super(line => this.handleCallback(line), () => this.handleConnect(), () => this.handleDisconnect());
        this._wsUrl = _wsUrl;
        this._webSocketOnMessage = (data) => {
            for (const line of data.toString().split("\r\n")) {
                if (line.length) {
                    this.feed(line);
                }
            }
        };
    }
    async loginAnon() {
        await this.sendRawLine(`NICK justinfan93434586`);
    }
    async whisper(usr, msg) {
        await this.send("forsen", `/w ${usr} ${msg}`);
    }
    async reqCap(name) {
        await super.reqCap(`:twitch.tv/${name}`);
    }
    handleCallback(line) {
        return new Promise((resolve, reject) => {
            if (!this._webSocket || this._webSocket.readyState !== WebSocket.OPEN) {
                throw new Error("WebSocket not connected");
            }
            this._webSocket.send(line, err => err ? reject(err) : resolve());
        });
    }
    handleConnect() {
        return new Promise((resolve, reject) => {
            const handleOpenOrError = (err) => {
                this._webSocket.removeEventListener("open", handleOpenOrError);
                this._webSocket.removeEventListener("error", handleOpenOrError);
                err ? reject(err) : resolve();
            };
            this._webSocket = new WebSocket(this._wsUrl);
            this._webSocket.on("open", handleOpenOrError);
            this._webSocket.on("error", handleOpenOrError);
            this._webSocket.on("message", this._webSocketOnMessage);
        });
    }
    handleDisconnect() {
        if (!this._webSocket) {
            return;
        }
        this._webSocket.close();
        this._webSocket = undefined;
    }
}
exports.TwitchIrcBot = TwitchIrcBot;
