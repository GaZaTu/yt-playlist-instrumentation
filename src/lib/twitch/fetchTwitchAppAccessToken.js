"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitchAppAccessToken = void 0;
const axios_1 = require("axios");
class TwitchAppAccessToken {
    constructor(_jsonData) {
        this._jsonData = _jsonData;
    }
    get accessToken() {
        return this._jsonData.access_token;
    }
    get refreshToken() {
        return this._jsonData.refresh_token;
    }
    get expiresIn() {
        return this._jsonData.expires_in;
    }
    get scope() {
        return this._jsonData.scope;
    }
    get tokenType() {
        return this._jsonData.token_type;
    }
    get asAuthorizationHeader() {
        return `${this.tokenType} ${this.accessToken}`;
    }
}
exports.TwitchAppAccessToken = TwitchAppAccessToken;
const fetchTwitchAppAccessToken = (clientId, clientSecret, grantType = 'client_credentials') => axios_1.default.post(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=${grantType}`)
    .then(res => new TwitchAppAccessToken(res.data));
exports.default = fetchTwitchAppAccessToken;
