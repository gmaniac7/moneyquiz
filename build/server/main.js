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
const Server_1 = require("./classes/Server");
process.title = 'quizapp';
const passport = require('passport');
const FacebookStrategy = require('passport-facebook');
const basicAuth = require('express-basic-auth');
const mongodb = require('mongodb');
const fs = require('fs');
const path = require('path');
const Redis = require('ioredis');
const FB = require('fb');
const crypto = require('crypto');
const uuid = require('uuid/v4');
const Rollbar = require("rollbar");
var rollbar = new Rollbar({
    accessToken: '75288f30fae8498cb3bc4c069821199e',
    captureUncaught: true,
    captureUnhandledRejections: true
});
var fb = new FB.Facebook({ appId: '1704758906490554', appSecret: 'a33b8018b06341e7aefee85bc91341d3' });
var Redlock = require('redlock');
var db, redis, secret, redlock;
require('./catchPromisePolyfill');
function loadSecret() {
    secret = fs.readFileSync('secret.key');
    console.log('Secret loaded.');
}
try {
    loadSecret();
}
catch (err) {
    console.log('No secret, making new...');
    fs.writeFileSync('secret.key', crypto.randomBytes(512).toString('base64'));
    loadSecret();
}
(() => __awaiter(this, void 0, void 0, function* () {
    let mongoAuth = `admin:${encodeURIComponent(`admin123`)}@`;
    // let mongoUrl = `mongodb://${mongoAuth}quizapp:27017/quizapp?authSource=admin`;
    let mongoUrl = `mongodb://${mongoAuth}35.233.36.227:27017/admin?authSource=admin`;
    db = yield new mongodb.MongoClient().connect(mongoUrl);
    console.log('Mongodb connected.');
    redis = new Redis();
    redis.on('connect', () => __awaiter(this, void 0, void 0, function* () {
        console.log('Redis connected.');
        redlock = new Redlock(
        // You should have one client for each redis node
        // in your cluster
        [redis], {
            // The expected clock drift; for more details
            // See http://redis.io/topics/distlock
            driftFactor: 0.01,
            // The max number of times Redlock will attempt
            // to lock a resource before erroring
            retryCount: 10,
            // The time in ms between attempts
            retryDelay: 200,
            // The max time in ms randomly added to retries
            // to improve performance under high contention
            // see https://www.awsarchitectureblog.com/2015/03/backoff.html
            retryJitter: 200 // time in ms
        });
        loadModules();
    }));
}))();
const app = new Server_1.default({
    port: 8080,
    bind: 'localhost',
    //bind: '35.233.36.227',
    // bind: 'quizapp',
    static: path.resolve('../../server/client')
});
console.log(app);
app.once('listening', () => console.log('Server listening.'));
// Load call handlers
function loadModules() {
    // CORS
    console.log(app.router);
    app.router.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'x-sqtoken, content-type');
        res.setHeader('Access-Control-Request-Headers', 'x-sqtoken, content-type');
        res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
        next();
    });
    app.router.options('*', (req, res) => res.status(200).end());
    // App calls
    for (let file of fs.readdirSync('./server/api')) {
        console.log("Files were found. Stop something. Let's create something good");
        require(`./api/${file.split(/\.ts$/)[0]}`)({ app, auth, mongodb, redis, uuid, db, redlock, shuffle, encrypt, decrypt, crypto, secret, makeToken, createUser, fb, rollbar });
    }
    // Admin calls
    require('./admin-calls')({ basicAuth, app, path, fs, db, mongodb });
}
// Shuffles an array in place, and also returns it
function shuffle(a) {
    for (let i = a.length; i; i--) {
        let j = ~~(Math.random() * i);
        [a[i - 1], a[j]] = [a[j], a[i - 1]];
    }
    return a;
}
// Authentication middleware
function auth(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        let token = req.headers['x-sqtoken'];
        if (!token)
            return res.status(401).send('Unauthorized.');
        let [data, sig] = token && token.split('.');
        if (token && sig == crypto.createHmac('sha256', secret).update(data).digest('base64')) {
            let { _id } = JSON.parse(new Buffer(data, 'base64').toString('utf8'));
            let user = yield db.collection('system.users').findOne({ _id: mongodb.ObjectID(_id) });
            if (user) {
                if (user.access) {
                    req.user = user;
                    next();
                }
                else
                    res.status(403).send('Access revoked.');
            }
            else
                res.status(404).send('No such user.');
        }
        else
            res.status(401).send('Unauthorized.');
    });
}
// Creates user
function createUser(document) {
    return __awaiter(this, void 0, void 0, function* () {
        !document.ts && (document.ts = Date.now());
        !document.coupons && (document.coupons = []);
        !document.points && (document.points = 0);
        !('access' in document) && (document.access = true);
        !document.inventory && (document.inventory = {
            fiftyfifty: 4,
            timeboost: 4,
            peoplechoice: 4,
            skip: 4
        });
        document.totalCashEarned = 0;
        document.email = document.email.toLowerCase();
        return (yield db.collection('system.users').insert(document)).ops[0];
    });
}
// Generates token
function makeToken(user) {
    let data = {
        _id: user._id,
        ts: Date.now()
    };
    let base64Data = new Buffer(JSON.stringify(data)).toString('base64');
    return `${base64Data}.${crypto.createHmac('sha256', secret).update(base64Data).digest('base64')}`;
}
// Encrypts text
function encrypt(text) {
    var cipher = crypto.createCipher('aes-256-ctr', secret);
    var crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}
// Decrypts text
function decrypt(text) {
    var decipher = crypto.createDecipher('aes-256-ctr', secret);
    var dec = decipher.update(text, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
}
