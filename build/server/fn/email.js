"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
function email(to, subject, html, text) {
    return __awaiter(this, void 0, void 0, function* () {
        var http = require("https");
        var options = {
            method: 'post',
            hostname: 'api.elasticemail.com',
            path: '/v2/email/send',
            headers: {
                'cache-control': 'no-cache',
                'content-type': 'application/x-www-form-urlencoded'
            }
        };
        return yield new Promise(resolve => {
            let req = http.request(options, function (res) {
                var chunks = [];
                res.on("data", function (chunk) {
                    chunks.push(chunk);
                });
                res.on("end", function () {
                    var body = Buffer.concat(chunks);
                    try {
                        resolve(JSON.parse(body.toString()));
                    }
                    catch (err) {
                        resolve({ success: false });
                    }
                });
            });
            req.write(require('querystring').stringify({
                apikey: '154f3a2b-2e47-48b6-bb40-c81892729121',
                from: 'noreply@shopping-quiz.com',
                fromName: 'Shopping Quiz',
                subject: subject,
                bodyHtml: html,
                bodyText: text,
                to: to,
                isTransactional: 'True'
            }));
            req.end();
        });
    });
}
exports.default = email;
