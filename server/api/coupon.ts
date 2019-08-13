module.exports = ({app, auth, mongodb, redis, uuid, db, redlock, shuffle, createUser, makeToken, fb}) => {

  app.router.get('/v1/coupon/:user_id/:coupon_code', async (req, res, next) => {

    // Get the user
    let user = await db.collection('system.users').findOne({ _id: mongodb.ObjectID(req.params.user_id) });

    // If no user, return with error
    if (!user)
      return res.status(400).send('User does not exist.');

    // Get the coupon
    let coupon = user.coupons.filter(c => c.code == req.params.coupon_code)[0];

    // If no coupon, return with error
    if (!coupon)
      return res.status(400).send('Coupon not found in the user\'s collection.');

    // If coupon is used, return with error
    if (coupon.used)
      return res.status(400).send('Coupon has been used.');

    // Get coupon info
    let couponInfo = await db.collection('coupons').findOne({ _id: mongodb.ObjectID(coupon.couponId) });

    // If the coupon record was not found, return with error
    if (!couponInfo)
      return res.status(400).send('This coupon is no longer in the system.');

    // Otherwise, show info
    res.send(`
        <html>
         <head>
         <script
           src="https://code.jquery.com/jquery-3.2.1.min.js"
           integrity="sha256-hwg4gsxgFZhOsEEamdOYGBf13FyQuiTwlAQgxVSNgt4="
           crossorigin="anonymous"></script>
         </head>
         <body>
            <h3><b>${couponInfo.title}</b></h3>
            <div><b>${couponInfo.description}</b></div>
            <div>Coupon is valid for <b>${user.firstName} ${user.lastName}</b>.</div>
            <button>Mark as used</button>
            <script>
               $('button').click(function(){
                  $.post('/v1/coupon/${user._id}/${coupon.code}', function(){location.reload();});
               });
            </script>
         </body>
        </html>
    `);
  });

  app.router.post('/v1/coupon/:user_id/:coupon_code', async (req, res, next) => {

    // Get the user
    let user = await db.collection('system.users').findOne({ _id: mongodb.ObjectID(req.params.user_id) });

    // Mark coupon as used
    for (let coupon of user.coupons)
      if (coupon.code == req.params.coupon_code) {
        await db.collection('system.users').update({ _id: mongodb.ObjectID(user._id) }, { $set: { [`coupons.${user.coupons.indexOf(coupon)}.used`]: true } });
        await db.collection('coupons').update({ _id: mongodb.ObjectID(coupon.couponId) }, { $inc: { used: 1 } });

        if(coupon.hasPredefinedCodes)
         await db.collection('couponCodes').update({ coupon_id: coupon.couponId, code: coupon.code }, { $set: { used: true } });

        break;
      }

    // Return ok
    res.send('ok');

  });

}
