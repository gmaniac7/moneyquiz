const SqliteToJson = require('sqlite-to-json');
const sqlite3 = require('sqlite3');

const exporter = new SqliteToJson({
    client: new sqlite3.Database('input.sqlite')
});

exporter.save('pergunta', 'output.json', () => console.log('cool'));
