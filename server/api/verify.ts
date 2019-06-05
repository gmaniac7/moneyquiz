module.exports = ({app, auth, mongodb, redis, uuid, db, redlock, shuffle, decrypt, createUser, crypto, secret, rollbar}) => {

  app.router.get('/v1/verify/:info', async (req, res, next) => {
    try {
      let info = JSON.parse(decrypt(req.params.info));
      let user = await db.collection('users').findOne({ email: info.username });
      let user2 = null;
      if(info.fbid)
        user2 = await db.collection('users').findOne({ fbid: info.fbid });

      if (user || user2)
        res.status(402).send('User exists.');
      else if (info.fbid) {
        await createUser({
          fbid: info.fbid,
          image: `https://graph.facebook.com/${info.fbid}/picture`,
          email: info.username,
          firstName: info.firstName,
          lastName: info.lastName,
          displayName: [info.firstName, info.lastName].join(' ')
        });
        res.send('Συγχαρητήρια ολοκληρώσατε την εγγραφή σας. Ευχαριστούμε πολυ!');
      }
      else {
        let salt = crypto.randomBytes(20).toString('base64');
        info.password = `${salt}.${crypto.createHmac('sha256', secret).update(info.password + salt).digest('base64')}`;
        await createUser({
          email: info.username,
          password: info.password,
          firstName: info.firstName,
          lastName: info.lastName,
          displayName: [info.firstName, info.lastName].join(' ')
        });
        res.send('Συγχαρητήρια ολοκληρώσατε την εγγραφή σας. Ευχαριστούμε πολυ!');
      }
    } catch (ex) {
      rollbar.error(ex);
      res.status(500).send('something went wrong')
    }
  });

}
