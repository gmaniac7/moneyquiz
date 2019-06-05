var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
module.exports = ({ app, auth, mongodb, redis, uuid, db, redlock, shuffle, createUser, makeToken, fb, rollbar }) => {
    app.router.get('/v1/fblogin/:token', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        try {
            fb.setAccessToken(req.params.token);
            let data = yield fb.api('/me?fields=name,gender,email');
            if (data && data.email) {
                let userFound = yield db.collection('users').findOne({ fbid: data.id });
                if (!userFound)
                    userFound = yield createUser({
                        fbid: data.id,
                        image: `https://graph.facebook.com/${data.id}/picture`,
                        fbdata: data,
                        email: data.email,
                        firstName: data.name.split(' ')[0],
                        lastName: data.name.split(' ').pop(),
                        displayName: [data.name.split(' ')[0], data.name.split(' ').pop()].join(' ')
                    });
                res.send(makeToken(userFound));
            }
            else if (data && data.id && data.name) {
                let userFound = yield db.collection('users').findOne({ fbid: data.id });
                if (!userFound)
                    res.status(412).json({ message: 'User does not have email on fb. We need to get it ourselves', fbid: data.id, firstName: data.name.split(' ')[0], lastName: data.name.split(' ').pop() });
                else
                    res.send(makeToken(userFound));
            }
            else {
                rollbar.log(new Error('fb /me call failed. data returned: ' + JSON.stringify(data)));
                res.status(401).send('Bad access token or insufficient privileges.');
            }
        }
        catch (ex) {
            rollbar.error(ex);
            res.status(500).send('something went wrong');
        }
    }));
};
