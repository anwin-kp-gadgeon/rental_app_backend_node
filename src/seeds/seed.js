require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const {
	User,
	Property,
	Review,
	Favorite,
	Viewing,
	Chat,
	Message,
	Notification,
} = require('../models');

// Sample data
const users = [
	{
		name: 'Admin User',
		email: 'admin@rentalapp.com',
		password: 'Admin123',
		phoneNumber: '+1-555-0100',
		role: 'admin',
		isActive: true,
		bio: 'System administrator',
		photoUrl:
			'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop',
	},
	{
		name: 'John Owner',
		email: 'john@rentalapp.com',
		password: 'John1234',
		phoneNumber: '+1-555-0101',
		role: 'owner',
		isActive: true,
		bio: 'Property owner with 5 years of experience',
		photoUrl:
			'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
	},
	{
		name: 'Jane Owner',
		email: 'jane@rentalapp.com',
		password: 'Jane1234',
		phoneNumber: '+1-555-0102',
		role: 'owner',
		isActive: true,
		bio: 'Real estate investor and property manager',
		photoUrl:
			'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
	},
	{
		name: 'Mike User',
		email: 'mike@rentalapp.com',
		password: 'Mike1234',
		phoneNumber: '+1-555-0103',
		role: 'user',
		isActive: true,
		bio: 'Looking for the perfect home',
		photoUrl:
			'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
	},
	{
		name: 'Sarah User',
		email: 'sarah@rentalapp.com',
		password: 'Sarah1234',
		phoneNumber: '+1-555-0104',
		role: 'user',
		isActive: true,
		bio: 'Relocating for work',
		photoUrl:
			'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
	},
];

const properties = [
	{
		title: 'Luxury Downtown Apartment',
		description:
			'Beautiful modern apartment in the heart of downtown with stunning city views. Features floor-to-ceiling windows, hardwood floors, and a gourmet kitchen.',
		propertyType: 'apartment',
		location: '123 Main Street, New York, NY 10001',
		price: 3500,
		bedrooms: 2,
		bathrooms: 2,
		squareFeet: 1200,
		amenities: [
			'WiFi',
			'AC',
			'Gym',
			'Parking',
			'Doorman',
			'Laundry',
			'Dishwasher',
			'Elevator',
		],
		images: [
			'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
			'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
			'https://images.unsplash.com/photo-1484154218962-a1c002085d2f?w=800',
		],
		isAvailable: true,
		isApproved: true,
		status: 'approved',
		views: 125,
		averageRating: 4.8,
		reviewCount: 25,
	},
	{
		title: 'Cozy Beach House',
		description:
			'Charming beach house just steps from the ocean. Perfect for relaxing getaways. Includes a private deck and direct beach access.',
		propertyType: 'house',
		location: '456 Ocean Drive, Miami, FL 33139',
		price: 4200,
		bedrooms: 3,
		bathrooms: 2,
		squareFeet: 1800,
		amenities: ['WiFi', 'AC', 'Pool', 'Beach Access', 'BBQ', 'Patio', 'Parking'],
		images: [
			'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800',
			'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
			'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
		],
		isAvailable: true,
		isApproved: true,
		status: 'approved',
		views: 89,
		averageRating: 4.5,
		reviewCount: 12,
	},
	{
		title: 'Modern Loft Studio',
		description:
			'Spacious industrial-style loft with high ceilings and exposed brick. Located in the trendy arts district.',
		propertyType: 'studio',
		location: '789 Art Ave, Los Angeles, CA 90012',
		price: 2100,
		bedrooms: 1,
		bathrooms: 1,
		squareFeet: 800,
		amenities: ['WiFi', 'AC', 'Gym', 'Rooftop Access', 'Pet Friendly'],
		images: [
			'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800',
			'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800',
		],
		isAvailable: true,
		isApproved: true,
		status: 'approved',
		views: 210,
		averageRating: 4.2,
		reviewCount: 8,
	},
	{
		title: 'Suburban Family Home',
		description:
			'Large family home with a backyard and garage. Quiet neighborhood near schools and parks.',
		propertyType: 'house',
		location: '321 Oak Lane, Austin, TX 78701',
		price: 2800,
		bedrooms: 4,
		bathrooms: 3,
		squareFeet: 2400,
		amenities: ['WiFi', 'AC', 'Garage', 'Backyard', 'Fireplace', 'Washer/Dryer'],
		images: [
			'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
			'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800',
			'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=800',
		],
		isAvailable: true,
		isApproved: true,
		status: 'approved',
		views: 156,
		averageRating: 4.9,
		reviewCount: 18,
	},
	{
		title: 'Downtown Penthouse',
		description:
			'Exclusive penthouse suite with panoramic views. Luxury living at its finest.',
		propertyType: 'apartment',
		location: '555 High Rise Blvd, Chicago, IL 60601',
		price: 6500,
		bedrooms: 3,
		bathrooms: 3.5,
		squareFeet: 2800,
		amenities: ['WiFi', 'AC', 'Concierge', 'Pool', 'Gym', 'Spa', 'Valet Parking'],
		images: [
			'https://images.unsplash.com/photo-1512918760532-3ed00af63671?w=800',
			'https://images.unsplash.com/photo-1502005229766-528352261b7a?w=800',
		],
		isAvailable: true,
		isApproved: true,
		status: 'approved',
		views: 340,
		averageRating: 5.0,
		reviewCount: 5,
	},
	{
		title: 'Cozy Mountain Cabin',
		description:
			'Rustic cabin in the woods. Perfect for nature lovers and winter getaways.',
		propertyType: 'house',
		location: '888 Pine Road, Denver, CO 80202',
		price: 1800,
		bedrooms: 2,
		bathrooms: 1,
		squareFeet: 950,
		amenities: ['Fireplace', 'Heating', 'Parking', 'Deck', 'Mountain View'],
		images: [
			'https://images.unsplash.com/photo-1449156493391-d2cfa28e468b?w=800',
			'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800',
		],
		isAvailable: true,
		isApproved: true,
		status: 'approved',
		views: 95,
		averageRating: 4.7,
		reviewCount: 15,
	},
];

const seedDatabase = async () => {
	try {
		// Connect to database
		await connectDB();
		console.log('🌱 Starting database seeding...');

		// Clear existing data
		console.log('\n🗑️  Clearing existing data...');
		await Promise.all([
			User.deleteMany({}),
			Property.deleteMany({}),
			Review.deleteMany({}),
			Favorite.deleteMany({}),
			Viewing.deleteMany({}),
			Chat.deleteMany({}),
			Message.deleteMany({}),
			Notification.deleteMany({}),
		]);
		console.log('✅ Existing data cleared');

		// Create users
		console.log('\n👥 Creating users...');
		const createdUsers = await User.create(users);
		const admin = createdUsers.find((u) => u.role === 'admin');
		const owner1 = createdUsers.find((u) => u.email === 'john@rentalapp.com');
		const owner2 = createdUsers.find((u) => u.email === 'jane@rentalapp.com');
		const user1 = createdUsers.find((u) => u.email === 'mike@rentalapp.com');
		const user2 = createdUsers.find((u) => u.email === 'sarah@rentalapp.com');
		console.log(`✅ Created ${createdUsers.length} users`);

		// Assign owners to properties
		properties[0].ownerId = owner1._id;
		properties[1].ownerId = owner1._id;
		properties[2].ownerId = owner2._id;
		properties[3].ownerId = owner2._id;
		properties[4].ownerId = owner1._id;
		properties[5].ownerId = owner2._id;

		// Create properties
		console.log('\n🏠 Creating properties...');
		const createdProperties = await Property.create(properties);
		console.log(`✅ Created ${createdProperties.length} properties`);

		// Create reviews
		console.log('\n⭐ Creating reviews...');
		const reviews = [
			{
				propertyId: createdProperties[0]._id,
				userId: user1._id,
				userName: user1.name,
				rating: 5,
				reviewText: 'Absolutely loved this place! The view is incredible.',
			},
			{
				propertyId: createdProperties[0]._id,
				userId: user2._id,
				userName: user2.name,
				rating: 4,
				reviewText: 'Great apartment, but parking was a bit tight.',
			},
			{
				propertyId: createdProperties[1]._id,
				userId: user1._id,
				userName: user1.name,
				rating: 5,
				reviewText: 'Perfect beach vacation. Will definitely come back!',
			},
			{
				propertyId: createdProperties[3]._id,
				userId: user2._id,
				userName: user2.name,
				rating: 5,
				reviewText: 'Great family home. The backyard is huge!',
			},
		];
		await Review.create(reviews);
		console.log(`✅ Created ${reviews.length} reviews`);

		// Create favorites
		console.log('\n❤️ Creating favorites...');
		const favorites = [
			{ userId: user1._id, propertyId: createdProperties[0]._id },
			{ userId: user1._id, propertyId: createdProperties[2]._id },
			{ userId: user2._id, propertyId: createdProperties[1]._id },
			{ userId: user2._id, propertyId: createdProperties[3]._id },
		];
		await Favorite.create(favorites);
		console.log(`✅ Created ${favorites.length} favorites`);

		// Create viewings
		console.log('\n📅 Creating viewings...');
		const viewings = [
			{
				propertyId: createdProperties[0]._id,
				userId: user1._id,
				ownerId: createdProperties[0].ownerId,
				date: new Date(Date.now() + 86400000), // Tomorrow
				status: 'pending',
				note: 'Would like to see it in the afternoon',
			},
			{
				propertyId: createdProperties[2]._id,
				userId: user2._id,
				ownerId: createdProperties[2].ownerId,
				date: new Date(Date.now() + 172800000), // Day after tomorrow
				status: 'confirmed',
				note: 'Morning viewing preferred',
			},
		];
		await Viewing.create(viewings);
		console.log(`✅ Created ${viewings.length} viewings`);

		// Create chats and messages
		console.log('\n💬 Creating chats and messages...');
		const chat = await Chat.create({
			participants: [user1._id, owner1._id],
		});

		const messages = [
			{
				chatId: chat._id,
				senderId: user1._id,
				receiverId: owner1._id,
				content: 'Hi, is the downtown apartment still available?',
			},
			{
				chatId: chat._id,
				senderId: owner1._id,
				receiverId: user1._id,
				content: 'Yes it is! Would you like to schedule a viewing?',
			},
			{
				chatId: chat._id,
				senderId: user1._id,
				receiverId: owner1._id,
				content: 'That would be great. How about tomorrow?',
			},
		];
		await Message.create(messages);

		// Update chat last message
		chat.lastMessage = messages[2].content;
		chat.lastMessageTime = messages[2].createdAt;
		await chat.save();
		console.log(`✅ Created 1 chat with ${messages.length} messages`);

		// Create notifications
		console.log('\n🔔 Creating notifications...');
		const notifications = [
			{
				userId: owner1._id,
				type: 'viewing',
				title: 'New Viewing Request',
				body: `${user1.name} requested a viewing for ${createdProperties[0].title}`,
				data: { propertyId: createdProperties[0]._id, viewingId: viewings[0]._id },
			},
			{
				userId: user2._id,
				type: 'viewing',
				title: 'Viewing Confirmed',
				body: `Your viewing for ${createdProperties[2].title} has been confirmed`,
				data: { propertyId: createdProperties[2]._id, viewingId: viewings[1]._id },
			},
		];
		await Notification.create(notifications);
		console.log(`✅ Created ${notifications.length} notifications`);

		console.log('\n════════════════════════════════════════════════════════');
		console.log('🎉 Database seeding completed successfully!');
		console.log('\nTest Accounts:');
		console.log('────────────────────────────────────────────────────────');
		console.log('  admin      | admin@rentalapp.com       | Admin123');
		console.log('  owner      | john@rentalapp.com        | John1234');
		console.log('  owner      | jane@rentalapp.com        | Jane1234');
		console.log('  user       | mike@rentalapp.com        | Mike1234');
		console.log('  user       | sarah@rentalapp.com       | Sarah1234');
		console.log('════════════════════════════════════════════════════════');

		process.exit(0);
	} catch (error) {
		console.error('\n❌ Error seeding database:', error);
		process.exit(1);
	}
};

seedDatabase();
