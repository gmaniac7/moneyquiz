const mongodb = require('mongodb');

console.log('Loading db...');
const db = require('./output');
console.log('Db loaded.');

(async() => {
	let mongoAuth = `admin:${encodeURIComponent(`}EJ}WX/,D6S#<kes`)}@`;
	let mongoUrl = `mongodb://${mongoAuth}104.199.107.178:27017/quizapp?authSource=admin`;
	dbc = await new mongodb.MongoClient().connect(mongoUrl);
	console.log('Mongodb connected.');

	let record, c = 0;
	while (record = db.shift()) {
		console.log(c++);
		await dbc.collection('questions').update({
			id: record.idPergunta
		}, {
			$set: {
				id: record.idPergunta,
				question: record.Pergunta,
				correct_response: record.Resposta_correta,
				wrong_response_1: record.Resposta_errada_1,
				wrong_response_2: record.Resposta_errada_2,
				wrong_response_3: record.Resposta_errada_3,
				img: record.Imagem,
				difficulty: record.idDificuldade,
				category: record.idCategoria,
				subcategory: record.idSubcategoria,
				link: record.Link,
				version: record.Versao
			}
		}, {
			upsert: true
		});
	}

	console.log('Done.');
})();
