const express = require('express');

module.exports = ({basicAuth, app, path, fs, db, mongodb}) => {

  app.router.get(['/uploads*', '/qr*'], express.static(path.resolve('./server/client')));

  app.router.use(basicAuth({
    async authorizer(username, password, cb) {
      if (await db.collection('adminUsers').findOne({ username, password }))
        cb(null, true);
      else
        cb(null, false);
    },
    authorizeAsync: true,
    challenge: true,
    realm: 'quizappAdmin'
  }));

  app.router.get('/coupon/:couponId/couponcodes/massive', async (req, res) => {
    res.send(`
        <html>
          <body>
            <form method="post" enctype="multipart/form-data">
              <input type="file" name="file" />
              <input type="submit" value="Submit" />
            </form>
          </body>
        </html>
      `);
  });

  app.router.post('/coupon/:couponId/couponcodes/massive', async (req, res) => {
    try {
      if(!req.params.couponId) {
        res.send('couponId not defined');
        return;
      }
      let coupon = await db.collection('coupons').findOne({ _id: mongodb.ObjectID(req.params.couponId) });
      if(!coupon) {
        res.send('coupon not found with id ' + req.params.couponId);
        return;
      }

      var data = fs.readFileSync(req.files.file.path, 'utf-8');

      var codes = data.split(',').map(item => {
        return item.replace(/(^['"`\s]+|['"`\s]+$)/mg, ''); //remove quotation marks and spaces from the start/end
      });
      // res.send(codes);

      codes.forEach(async (code) => {
        if(!code) return;

        await db.collection('couponCodes').insert({
          "coupon_id": req.params.couponId,
          "code": code,
          "won": false
        });
        IncreaseCouponQuantity(req.params.couponId);
      });

      res.send('Coupon Codes Added');
    }
    catch(ex) {
      res.status(500).send(ex.toString());
    }
  });

  app.router.post('/data/file', async (req, res) => {
    let tmpFileName = req.files.file.path.split('/').pop();
    fs.rename(req.files.file.path, path.resolve(__dirname, `../../server/client/uploads/${tmpFileName}`), console.log);
    res.end(tmpFileName);
  });

  app.router.get('/data/:table/:skip?/:limit?', async (req, res) => {
    let meta = await db.collection('meta').findOne({ table: req.params.table });
    let filters = {};
    for (let field of meta.fields) {
      if (field.type == 'foreign_key')
        field.options = await db.collection(field.foreign_key_table).find().toArray();
      if (field.filter)
         filters[field.key] = { $in: field.filter }
    }
    res.end(JSON.stringify({
      count: await db.collection(req.params.table).count(),
      meta,
      results: await db.collection(req.params.table).find(filters).skip(+req.params.skip || 0).limit(+req.params.limit || 50).toArray()
    }));
  });

  app.router.patch('/data/:table', async (req, res) => {
    await db.collection(req.params.table).update({
      _id: mongodb.ObjectID(req.body._id)
    }, {
        $set: {
          [req.body.key]: isNaN(req.body.value) || typeof req.body.value == 'boolean' ? req.body.value : +req.body.value
        }
      });
    res.end(JSON.stringify({ success: true }));
  });

  app.router.delete('/data/:table/:id', async (req, res) => {
    await db.collection(req.params.table).remove({
      _id: mongodb.ObjectID(req.params.id)
    });
    res.end(JSON.stringify({ success: true }));
  });

  app.router.get('/files/won_coupons/:coupon_id', async (req, res) => {

    var usersThatWon = await db.collection('users').find({"coupons.couponId": req.params.coupon_id}, {email: 1}).toArray();

    var text = (usersThatWon.length) ? usersThatWon.map((user) => {
      return user.email;
    }).join('\r\n') : 'None has won';

    res.setHeader('Content-type', "application/octet-stream");
    res.setHeader('Content-disposition', `attachment; filename=${req.params.coupon_id}.txt`);
    res.send(text);
  });

  app.router.put('/data/:table', async (req, res) => {
    for (let key in req.body)
      req.body[key] = isNaN(req.body[key]) || typeof req.body.value == 'boolean' ? req.body[key] : +req.body[key];
    await db.collection(req.params.table).insert(req.body);

    if(req.params.table === 'couponCodes')
      if(req.body.coupon_id)
        IncreaseCouponQuantity(req.body.coupon_id);

    res.end(JSON.stringify({ success: true }));
  });

  app.router.get(['/', '/admin*'], (req, res) => {
    fs.createReadStream('./server/client/index.html').pipe(res);
  });

  var IncreaseCouponQuantity = async function(_id, quantity = 1) {
    await db.collection('coupons').update({
      _id: mongodb.ObjectID(_id)
      }, {
          $inc: { quantity: quantity }
      });
  }
}
