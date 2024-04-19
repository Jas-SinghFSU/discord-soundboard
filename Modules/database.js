require('dotenv').config();
const mongoClient = require('mongodb').MongoClient;

let db;

const connect = async () => {
	try {
		const mongoURI = process.env.MONGO_URI;

		log.info('Initializing database connection...');

		const dbConnection = await mongoClient.connect(mongoURI, { });
		db = dbConnection.db('GoonBot');

		log.info('Connected to database...');

		return {
			res: 'success',
			data: 'Successfully connected to database.',
		};
	} catch (error) {
		log.error(`An error occurred while connecting to database: ${error.message}`);
		return {
			res: 'fail',
			data: error,
		};
	}
};

const getDatabase = () => {
	return db;
};

const close = () => {
	db.close();
};

module.exports = {
	connect,
	getDatabase,
	close,
};
