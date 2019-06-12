import email from '../fn/email';

module.exports = async ({app, auth, mongodb, redis, uuid, db, redlock, shuffle, encrypt, secret, makeToken, createUser, fb, rollbar}) => {

  app.router.post('/v1/registeremail', async (req, res, next) => {
    try {
      console.log('register email call received');
      let [emailSubject, emailHtml, emailText] = (await db.collection('vars').findOne({ key: 'registerEmailTemplate' })).value;
      let user = await db.collection('users').findOne({ fbid: req.body.fbid });
      let user2 = await db.collection('users').findOne({ email: req.body.username });
      if (user || user2)
        res.status(402).send('User exists.');
      else {

        for (let field of ['username', 'fbid', 'firstName', 'lastName'])
          if (!req.body[field])
            return res.status(400).send('Fields username, fbid, firstName, lastName are required.');

        let link = `https://api.moneyquiz.gr/v1/verify/${encrypt(JSON.stringify({
          username: String(req.body.username),
          fbid: String(req.body.fbid),
          firstName: String(req.body.firstName),
          lastName: String(req.body.lastName),
          ts: Date.now()
        }))}`;
        if ((await email(
          req.body.username,
          emailSubject,
          emailHtml.replace(/:link/g, link),
          emailText.replace(/:link/g, link)
        )).success)
          res.send('ok');
        else
          res.status(400).send('Failed to send email.');
      }
    } catch (ex) {
      rollbar.error(ex);
      res.status(500).send('something went wrong')
    }
  });

}
