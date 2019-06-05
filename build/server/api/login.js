var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
module.exports = ({ app, auth, mongodb, redis, uuid, db, redlock, shuffle, crypto, secret, makeToken, createUser, fb, rollbar }) => {
    app.router.post('/v1/login', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        try {
            let user = yield db.collection('users').findOne({ email: req.body.username });
            if (user && !user.password)
                res.status(406).send('User is registered via fb. Use fb login');
            else if (user && user.password.split('.')[1] == crypto.createHmac('sha256', secret).update(req.body.password + user.password.split('.')[0]).digest('base64'))
                res.send(makeToken(user));
            else
                res.status(401).send('Unknown user/password combo.');
        }
        catch (ex) {
            rollbar.error(ex);
            res.status(500).send('something went wrong');
        }
    }));
};
