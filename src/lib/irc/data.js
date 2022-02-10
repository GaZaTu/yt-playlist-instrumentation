"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ircEventIs = void 0;
function ircEventIs(kind) {
    return (e) => {
        return e.event === kind;
    };
}
exports.ircEventIs = ircEventIs;
