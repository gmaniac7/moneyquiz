var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
module.exports = ({ app, auth, mongodb, redis, uuid, db, redlock, shuffle, crypto, secret, makeToken, createUser, fb, rollbar }) => {
    app.router.get('/v1/game/start/:coupon_id', auth, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        try {
            // Get coupon info
            let coupon = yield db.collection('coupons').findOne({ _id: mongodb.ObjectID(req.params.coupon_id), available: true });
            //check if the user has won a coupon from the same company that has not been used yet
            let userExists = yield db.collection('system.users').findOne({ "_id": mongodb.ObjectID(req.user._id), coupons: { $elemMatch: { "used": false, "business._id": mongodb.ObjectID(coupon.business_id) } } });
            // let userExists = await db.colletion("user").findOne({_id: mongodb.ObjectID(req.user._id), "coupons.used": false, "coupons.business._id": mongodb.ObjectID(coupon.business_id)}); //
            if (!!userExists)
                return res.status(412).send('You have already won a coupon from the same company that you have not used yet.');
            // If the user doesn't have Go For More points
            if (!req.user.goForMore) {
                let dayInMs = 24 * 60 * 60e3;
                let recentCoupons = req.user.coupons.sort((a, b) => b.c - a.c).slice(0, 3);
                // If the 3 last coupons were won within 24 hours, it must be over 48
                // hours from the last coupon in order to let him play
                if (recentCoupons.length && recentCoupons.length >= 3)
                    if (recentCoupons[0].wonAt - recentCoupons[2].wonAt < dayInMs)
                        if (Date.now() - recentCoupons[0].wonAt < 2 * dayInMs)
                            return res.status(406).send('You need more GoForMore points.');
                        else
                            yield db.collection('system.users').update({ _id: mongodb.ObjectID(req.user._id) }, { $inc: { goForMore: 3 } });
            }
            // If no coupon found return with error
            if (!coupon)
                return res.status(405).send('Unavailable coupon.');
            // Generate a new session id
            let sessionId = uuid();
            // Initialize session object in redis
            yield redis.hmset(`gs:${req.user._id}:${sessionId}`, {
                step: 0,
                couponId: req.params.coupon_id,
                targetScore: +coupon.points,
                questionIds: '',
                score: 0
            });
            yield redis.expire(`gs:${req.user._id}:${sessionId}`, 15);
            // Return session id
            res.end(sessionId);
        }
        catch (ex) {
            console.log('GAME START FAILEEEDE!!');
            console.log(ex);
            rollbar.error(ex);
            return res.status(500).send('something went wrong');
        }
    }));
};
