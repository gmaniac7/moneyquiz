"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const email_1 = require("../fn/email");
module.exports = ({ app, auth, mongodb, redis, uuid, db, redlock, shuffle, encrypt, secret, makeToken, createUser, fb, rollbar }) => __awaiter(this, void 0, void 0, function* () {
    app.router.post('/v1/registeremail', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('register email call received');
            let [emailSubject, emailHtml, emailText] = (yield db.collection('vars').findOne({ key: 'registerEmailTemplate' })).value;
            let user = yield db.collection('users').findOne({ fbid: req.body.fbid });
            let user2 = yield db.collection('users').findOne({ email: req.body.username });
            if (user || user2)
                res.status(402).send('User exists.');
            else {
                for (let field of ['username', 'fbid', 'firstName', 'lastName'])
                    if (!req.body[field])
                        return res.status(400).send('Fields username, fbid, firstName, lastName are required.');
                let link = `https://api.shopping-quiz.com/v1/verify/${encrypt(JSON.stringify({
                    username: String(req.body.username),
                    fbid: String(req.body.fbid),
                    firstName: String(req.body.firstName),
                    lastName: String(req.body.lastName),
                    ts: Date.now()
                }))}`;
                if ((yield email_1.default(req.body.username, emailSubject, emailHtml.replace(/:link/g, link), emailText.replace(/:link/g, link))).success)
                    res.send('ok');
                else
                    res.status(400).send('Failed to send email.');
            }
        }
        catch (ex) {
            rollbar.error(ex);
            res.status(500).send('something went wrong');
        }
    }));
});
