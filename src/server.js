const app = require('./app');
const config = require('./config');
const connectDB = require('./config/database');

// Connect to database and start server
const startServer = async () => {
	try {
		// Connect to MongoDB
		await connectDB();

		// Start server
		const server = app.listen(config.port, () => {
			console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🏠 Rental App API Server                                 ║
║                                                            ║
║   Environment: ${config.nodeEnv.padEnd(42)}║
║   Port: ${String(config.port).padEnd(49)}║
║   URL: http://localhost:${config.port}                              ║
║                                                            ║
║   API Endpoints:                                           ║
║   • Health: GET  /api/health                               ║
║   • Auth:   POST /api/auth/register                        ║
║   • Auth:   POST /api/auth/login                           ║
║   • Rentals: GET /api/rentals                              ║
║   • Bookings: GET /api/bookings                            ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
		});

		// Handle unhandled promise rejections
		process.on('unhandledRejection', (err) => {
			console.error('Unhandled Rejection:', err.message);
			// Close server & exit process
			server.close(() => {
				process.exit(1);
			});
		});

		// Handle uncaught exceptions
		process.on('uncaughtException', (err) => {
			console.error('Uncaught Exception:', err.message);
			process.exit(1);
		});

		// Graceful shutdown
		process.on('SIGTERM', () => {
			console.log('SIGTERM received. Shutting down gracefully...');
			server.close(() => {
				console.log('Process terminated');
				process.exit(0);
			});
		});
	} catch (error) {
		console.error('Failed to start server:', error.message);
		process.exit(1);
	}
};

startServer();
