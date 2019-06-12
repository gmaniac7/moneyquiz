export default async function email(to, subject, html, text): Promise<any> {
  var http = require("https");

  var options = {
    method: 'post',
    hostname: 'api.elasticemail.com',
    path: '/v2/email/send',
    headers: {
      'cache-control': 'no-cache',
      'content-type': 'application/x-www-form-urlencoded'
    }
  };

  return await new Promise(resolve => {
    let req = http.request(options, function(res) {
      var chunks = [];

      res.on("data", function(chunk) {
        chunks.push(chunk);
      });

      res.on("end", function() {
        var body = Buffer.concat(chunks);
        try {
          resolve(JSON.parse(body.toString()));
        } catch (err) {
          resolve({ success: false });
        }
      });
    });

    req.write(require('querystring').stringify({
      apikey: '154f3a2b-2e47-48b6-bb40-c81892729121',
      from: 'noreply@moneyquiz.gr',
      fromName: 'Shopping Quiz',
      subject: subject,
      bodyHtml: html,
      bodyText: text,
      to: to,
      isTransactional: 'True'
    }));
    req.end();
  });
}
