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
const fs_1 = require("fs");
const path = require("path");
const qr = require('qr-image');
module.exports = ({ app, auth, mongodb, redis, uuid, db, redlock, shuffle, crypto, secret, makeToken, createUser, fb, rollbar }) => {
    app.router.post('/v1/game/next/:session_id', auth, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('next question call received');
            // The session's key in redis
            let seskey = `gs:${req.user._id}:${req.params.session_id}`;
            // Get the session document
            let session = yield redis.hgetall(seskey);
            // If the session doesn't exist, return that it expired
            if (!session.couponId)
                return res.status(407).send('Game session expired.');
            // Get a lock so that only this answer will be used for this question
            let lock = yield redlock.lock(`l:s:${req.user._id}:${seskey}`, 2e3);
            // If we couldn't get a lock, return with error
            if (!lock)
                return res.status(406).send('Resource temporarily unavailable.');
            // Get how much time the player had left
            let ttl = +(yield redis.ttl(seskey));
            // If step == 0, proceed to the first question
            if (!+session.step)
                yield nextQuestion();
            else if (session.skip) {
                // Remove skip flag from session
                yield redis.hdel(seskey, 'skip');
                yield nextQuestion();
            }
            else {
                // Retrieve question info
                let question = yield db.collection('questions').findOne({ id: +session.questionId });
                // Calculate score to add
                let scoreToAdd = ttl <= 25 ? 40 : 50;
                // If the answer we got is correct
                if (req.body.answer == question.correct_response && ttl >= 5) {
                    // Update score
                    yield redis.hmset(seskey, { score: session.score = +session.score + scoreToAdd });
                }
                else {
                    // Deduct 10 points
                    yield redis.hmset(seskey, { score: session.score = +session.score - 10 });
                }
                if (session.score >= +session.targetScore)
                    yield endSession(true);
                else
                    yield nextQuestion(question.correct_response);
            }
            // Unlock this session at the end
            lock.unlock();
            function endSession(gameWasWon) {
                return __awaiter(this, void 0, void 0, function* () {
                    // Acquire a lock so that only this script changes coupon availability
                    let lock = yield redlock.lock(`l:q:${session.couponId}`, 2e3);
                    // If we didn't acquire a lock, return with error
                    if (!lock)
                        res.status(406).send('Resource temporarily unavailable.');
                    else {
                        // Get coupon info
                        let coupon = yield db.collection('coupons').findOne({ _id: mongodb.ObjectID(session.couponId) });
                        //null and undefined should behave like 0..
                        if (!coupon.issued) {
                            coupon.issued = 0;
                        }
                        // If coupon is still available and we have enough score, we won
                        let won = coupon.available && +coupon.issued < +coupon.quantity && +session.score >= +coupon.points;
                        if (!won && gameWasWon)
                            rollbar.warn(new Error(`won was false inside the endSession function. coupon.available: ${coupon.available} \r\n coupon.issued: ${coupon.issued} \r\n coupon.quantity: ${coupon.quantity} \r\n session.score: ${session.score} \r\n coupon.points: ${coupon.points}`));
                        // If we won
                        if (won) {
                            // Update coupon availability
                            yield db.collection('coupons').update({ _id: mongodb.ObjectID(session.couponId) }, {
                                $set: {
                                    available: coupon.issued + 1 < coupon.quantity
                                },
                                $inc: {
                                    issued: 1
                                }
                            });
                            let code;
                            // If this coupon has predefined codes
                            if (coupon.hasPredefinedCodes) {
                                // Find the first available code
                                let couponCode = yield db.collection('couponCodes').findOne({ coupon_id: `${coupon._id}`, won: { $ne: true } });
                                yield db.collection('couponCodes').update({ coupon_id: `${coupon._id}`, won: { $ne: true } }, { $set: { won: true } });
                                console.log(`coupon found ${couponCode}`);
                                code = couponCode.code;
                            }
                            else {
                                // Generate user coupon code
                                code = uuid();
                            }
                            let business = yield db.collection('businesses').findOne({ _id: mongodb.ObjectID(coupon.business_id) });
                            // return res.send(`after finding business id for coupon: ${JSON.stringify(business)}`);
                            // Update user record
                            yield db.collection('users').update({ _id: mongodb.ObjectID(req.user._id) }, {
                                $inc: {
                                    totalCashEarned: +coupon.value,
                                    goForMore: -1
                                },
                                $push: {
                                    coupons: {
                                        code,
                                        couponId: session.couponId,
                                        used: false,
                                        business: business,
                                        title: coupon.title,
                                        description: coupon.description,
                                        image: coupon.image,
                                        points: coupon.points,
                                        hasPredefinedCodes: coupon.hasPredefinedCodes,
                                        wonAt: Date.now()
                                    }
                                }
                            });
                            // Write coupon qrcode in disk
                            qr.image(`https://api.shopping-quiz.com/v1/coupon/${req.user._id}/${code}`, { type: 'svg' })
                                .pipe(fs_1.createWriteStream(path.resolve(__dirname, `../../../server/client/qr/${code}.svg`)));
                            // Email coupon to user
                            let qrUrl = `https://api.shopping-quiz.com/qr/${code}.svg`;
                            let ckUrl = `https://api.shopping-quiz.com/v1/coupon/${req.user._id}/${code}`;
                            email_1.default(req.user.email, `Κουπόνι Shopping Quiz!`, `Κερδίσατε το παρακάτω κουπόνι:<br/><br/><a href="${qrUrl}">${qrUrl}</a><br/><img src=""></img><h3>${coupon.title}</h3><p>${coupon.description}</p><br /><b>Κωδικός: ${code}</b> <br /><b>link ακύρωσης: <a href="${ckUrl}">https://api.shopping-quiz.com/v1/coupon/${req.user._id}/${code}</a></b> <br /><img style="max-width:500px" src="${business.image}"/> <br /><h3>${business.title}</h3> <br /><p>${business.description}</p> `, `Κερδίσατε το παρακάτω κουπόνι:\n\n${qrUrl}\n${coupon.title} ${coupon.description} (${code}) \n${business.title}\n${business.description} `);
                            //Email coupon to business
                            if (business.email)
                                email_1.default(business.email, `Κουπόνι Shopping Quiz!`, `Κερδήθηκε, από τον ${req.user.firstName} ${req.user.lastName} (${req.user.email}), το παρακάτω κουπόνι:<br/><br/><a href="${qrUrl}">${qrUrl}</a><br/><b>${coupon.title} ${coupon.description} (${code})</b> <br /><img style="max-width:500px" src="${business.image}"/> <br /><h3>${business.title}</h3> <br /><p>${business.description}</p> <br /><br /> Για να το ακυρωσετε πηγαινετε εδω: http://api.shopping-quiz.com/v1/coupon/${req.user._id}/${code}`, `Κερδήθηκε, από τον ${req.user.firstName} ${req.user.lastName} (${req.user.email}), το παρακάτω κουπόνι:\n\n${qrUrl}\n${coupon.title} ${coupon.description} (${code}) \n${business.title}\n${business.description} `);
                        }
                        // Delete session
                        yield redis.del(seskey);
                        // Return result
                        res.send(JSON.stringify({ won }));
                        // Release coupon lock
                        lock.unlock();
                        // Update user's points
                        db.collection('users').update({ _id: mongodb.ObjectID(req.user._id) }, { $inc: { points: +session.score } });
                    }
                });
            }
            // Proceed to next question
            function nextQuestion(lastCorrect) {
                return __awaiter(this, void 0, void 0, function* () {
                    // Get next step number
                    let step = +session.step + 1;
                    if (step > 15) {
                        console.log('Got to last step. Ending game...');
                        return yield endSession();
                    }
                    // Steps:               1  2  3  4  5  6  7  8  9  10 11 12 13 14 15
                    let difficulty = [null, 1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 5, 5][step];
                    // If user can't win, show easy questions
                    if ((15 - step + 1) * 50 + +session.score < +session.targetScore)
                        difficulty = 1;
                    // Pick random question
                    let question = (yield db.collection('questions').aggregate([
                        {
                            $match: {
                                // Pick questions that haven't been picked pefore in this session
                                id: { $nin: session.questionIds.split(',').map(v => +v) },
                                // Pick appropriate difficulty
                                difficulty
                            }
                        },
                        // Pick random question
                        { $sample: { size: 1 } }
                    ]).toArray())[0];
                    // Update session document
                    yield redis.hmset(seskey, {
                        step,
                        questionId: question.id,
                        questionIds: session.questionIds.split(',').filter(v => v).concat(question.id)
                    });
                    yield redis.expire(seskey, 39);
                    // Return new question
                    res.send(JSON.stringify({
                        step,
                        score: session.score,
                        question: question.question,
                        image: question.img,
                        lastCorrect,
                        answers: shuffle([question.correct_response, question.wrong_response_1, question.wrong_response_2, question.wrong_response_3])
                    }));
                    console.log(Object.assign(session, {
                        step,
                        questionId: question.id,
                        questionIds: session.questionIds.split(',').filter(v => v).concat(question.id)
                    }));
                });
            }
        }
        catch (ex) {
            rollbar.error(ex);
            res.status(500).send('something went wrong');
        }
    }));
};
