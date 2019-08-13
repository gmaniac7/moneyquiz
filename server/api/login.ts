module.exports = ({app, auth, mongodb, redis, uuid, db, redlock, shuffle, crypto, secret, makeToken, createUser, fb, rollbar}) => {

  app.router.post('/v1/login', async (req, res, next) => {
    try {
      let user = await db.collection('system.users').findOne({ email: req.body.username });

      if (user && !user.password)
        res.status(406).send('User is registered via fb. Use fb login');
      else if (user && user.password.split('.')[1] == crypto.createHmac('sha256', secret).update(req.body.password + user.password.split('.')[0]).digest('base64'))
        res.send(makeToken(user));
      else
        res.status(401).send('Unknown user/password combo.');
    } catch (ex) {
      rollbar.error(ex);
      res.status(500).send('something went wrong')
    }
  });

}
