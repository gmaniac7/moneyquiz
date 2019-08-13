module.exports = ({app, auth, mongodb, redis, uuid, db, redlock, shuffle, createUser, makeToken, fb, rollbar}) => {

  app.router.get('/v1/fblogin/:token', async (req, res, next) => {
    try {
      fb.setAccessToken(req.params.token);
      let data = await fb.api('/me?fields=name,gender,email');
      if (data && data.email) {
        let userFound = await db.collection('system.users').findOne({ fbid: data.id });

        if (!userFound)
          userFound = await createUser({
            fbid: data.id,
            image: `https://graph.facebook.com/${data.id}/picture`,
            fbdata: data,
            email: data.email,
            firstName: data.name.split(' ')[0],
            lastName: data.name.split(' ').pop(),
            displayName: [data.name.split(' ')[0], data.name.split(' ').pop()].join(' ')
          });

        res.send(makeToken(userFound));
      } else if (data && data.id && data.name) {
        let userFound = await db.collection('system.users').findOne({ fbid: data.id });

        if (!userFound)
          res.status(412).json({ message: 'User does not have email on fb. We need to get it ourselves', fbid: data.id, firstName: data.name.split(' ')[0], lastName: data.name.split(' ').pop() });
        else
          res.send(makeToken(userFound));
      } else {
        rollbar.log(new Error('fb /me call failed. data returned: ' + JSON.stringify(data)));
        res.status(401).send('Bad access token or insufficient privileges.');
      }
    } catch (ex) {
      rollbar.error(ex);
      res.status(500).send('something went wrong')
    }
  });

}
