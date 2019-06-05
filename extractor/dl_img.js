const fs = require('fs');
const db = require('./output');

try { fs.mkdirSync('img'); } catch (e) { }

(async function () {
    for (let q of db)
        if (q.Imagem && q.Imagem.trim()) {
            let url = q.Imagem;
            let lib = require(url.match(/^([https]{4,5}):/)[1]);
            console.log(`${url}...`);
            await new Promise(resolve => 
                lib.get(url, res => {
                    res.pipe(fs.createWriteStream(`img/${q.idPergunta}_${url.split('/').pop()}`));
                    res.on('end', resolve);
                })
            );
        }
})();
