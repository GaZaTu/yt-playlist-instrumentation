"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTwitchStreamLive = void 0;
const axios_1 = require("axios");
const fetchTwitchStream = (userLogin, clientId, accessToken) => axios_1.default.get(`https://id.twitch.tv/oauth2/token?user_login=${userLogin}`, {
    headers: {
        'Client-ID': clientId,
        'Authorization': accessToken.asAuthorizationHeader,
    },
})
    .then(res => res.data);
exports.default = fetchTwitchStream;
const isTwitchStreamLive = (userLogin, clientId, accessToken) => fetchTwitchStream(userLogin, clientId, accessToken)
    .then(res => res.data.length !== 0);
exports.isTwitchStreamLive = isTwitchStreamLive;
