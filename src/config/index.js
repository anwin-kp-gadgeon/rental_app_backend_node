require('dotenv').config();

module.exports = {
	port: process.env.PORT || 3000,
	nodeEnv: process.env.NODE_ENV || 'development',
	mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rental_app',
	jwt: {
		secret: process.env.JWT_SECRET || 'default_secret_key',
		expiresIn: process.env.JWT_EXPIRES_IN || '7d',
	},
	bcrypt: {
		saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
	},
};
