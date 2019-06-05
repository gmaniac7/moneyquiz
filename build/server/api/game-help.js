var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
module.exports = ({ app, auth, mongodb, redis, uuid, db, redlock, shuffle }) => {
    app.router.get('/v1/game/help/:type/:session_id', auth, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        // If the player doesn't have any of the requested help items return with error
        if (!(req.user.inventory[req.params.type] > 0))
            return res.status(405).send('Not help items left of this type.');
        // Get session info
        let session = yield redis.hgetall(`gs:${req.user._id}:${req.params.session_id}`);
        // If there is no such session, return with error
        if (!session.couponId)
            return res.status(407).send('Game session expired.');
        // If this session hasn't started yet, return with error
        if (!+session.step)
            return res.status(408).send('Cannot use help on unstarted game.');
        // Get a lock so that only this request is managing the user's remaining help items
        let lock = yield redlock.lock(`l:h:${req.user._id}`, 2e3);
        // If we didn't acquire the lock, return with error
        if (!lock)
            return res.status(406).send('Resource temporarily unavailable.');
        // Check if user spent the help item until we get the lock
        if (!((yield db.collection('users').findOne({ _id: mongodb.ObjectID(req.user._id) })).inventory[req.params.type] > 0))
            return res.status(405).send('Last help item of this type was spent before lock was acquired.');
        // Spend the help item
        yield db.collection('users').update({ _id: mongodb.ObjectID(req.user._id) }, { $inc: { ['inventory.' + req.params.type]: -1 } });
        // Handle each help item type
        switch (req.params.type) {
            // Item: fiftyfifty
            case 'fiftyfifty':
                // Get question info
                let q = yield db.collection('questions').findOne({ id: +session.questionId });
                // Shuffle the 3 wrong answers, remove 2, add the correct one, shuffle them again
                let answers = [q.wrong_response_1, q.wrong_response_2, q.wrong_response_3];
                shuffle(answers);
                answers.splice(0, 2);
                answers.push(q.correct_response);
                shuffle(answers);
                // Return 2 answers, one of which is definately the correct one
                res.end(JSON.stringify({ answers }));
                break;
            // Item: skip
            case 'skip':
                // Set skip flag in redis session object
                yield redis.hset(`gs:${req.user._id}:${req.params.session_id}`, 'skip', 1);
                // Return ok
                res.send('ok');
                break;
            // Item: timeboost
            case 'timeboost':
                // Get how much time is left in this question
                let ttl = yield redis.ttl(`gs:${req.user._id}:${req.params.session_id}`);
                // Add 15 seconds
                yield redis.expire(`gs:${req.user._id}:${req.params.session_id}`, +ttl + 15);
                // Return ok
                res.send('ok');
                break;
            // Item: peoplechoice
            case 'peoplechoice':
                // Get question info
                let qu = yield db.collection('questions').findOne({ id: +session.questionId });
                // Create an index of questions and their percentages
                let responseIndex = {};
                let a = [qu.wrong_response_1, qu.wrong_response_2, qu.wrong_response_3, qu.correct_response];
                shuffle(a);
                for (let ans of a)
                    responseIndex[ans] = ans == qu.correct_response ? Math.random() * 100 / qu.difficulty : Math.random() * 4 * qu.difficulty;
                // Make the numbers into percentages of their sum
                let total = Object.keys(responseIndex).map(k => responseIndex[k]).reduce((a, b) => a + b, 0);
                for (let key in responseIndex)
                    responseIndex[key] = ~~((responseIndex[key] / total) * 100);
                // Make sure the sum equals 100
                let totalThatShouldEqual100 = Object.keys(responseIndex).map(k => responseIndex[k]).reduce((a, b) => a + b, 0);
                responseIndex[Object.keys(responseIndex)[~~(Math.random() * 4)]] += 100 - totalThatShouldEqual100;
                // Return info for question
                res.send(JSON.stringify(responseIndex));
                break;
        }
        // Release the help item lock
        lock.unlock();
    }));
};
