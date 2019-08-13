module.exports = ({ app, auth, mongodb, redis, uuid, db, redlock, shuffle }) => {

  app.router.get('/v1/data/:thing', auth, async (req, res, next) => {
    switch (req.params.thing) {
      case 'text': res.send({
        rulesText: await db.collection('vars').findOne({ key: 'rulesText' }, { key: 1, value: 1 })
      }); break;
      case 'categories': res.send(await db.collection('categories').find({ available: true }).sort({ order: 1 }).toArray()); break;
      case 'coupons':
        let result = await db.collection('coupons').find({ available: true }).sort({ order: 1 }).toArray();
        result = result.filter(item => {
          return item.quantity && (!item.issued || item.quantity > item.issued);
        });
        let couponBusinesses = await db.collection('businesses').find({ _id: { $in: result.map(v => mongodb.ObjectID(v.business_id)) } }).toArray();
        result.forEach(v => v.business = couponBusinesses.filter(b => v.business_id == b._id)[0]);
        res.send(result);
        break;
      case 'highscores': res.send(await db.collection('system.users').find({}, { displayName: 1, points: 1, image: 1 }).sort({ points: -1 }).limit(50).toArray()); break;
      case 'me': res.send(await db.collection('system.users').findOne({ _id: mongodb.ObjectID(req.user._id) }, {
        firstName: 1,
        lastName: 1,
        email: 1,
        fbdata: 1,
        coupons: 1,
        inventory: 1,
        image: 1,
        points: 1,
        totalCashEarned: 1
      })); break;
    }
  });

}
