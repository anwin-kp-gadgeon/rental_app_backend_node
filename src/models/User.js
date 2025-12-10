const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config');

const userSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: [true, 'Email is required'],
			unique: true,
			trim: true,
			lowercase: true,
			match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
		},
		password: {
			type: String,
			minlength: [6, 'Password must be at least 6 characters'],
			select: false,
		},
		name: {
			type: String,
			required: [true, 'Name is required'],
			trim: true,
			minlength: [2, 'Name must be at least 2 characters'],
			maxlength: [100, 'Name cannot exceed 100 characters'],
		},
		role: {
			type: String,
			enum: ['admin', 'owner', 'user'],
			default: 'user',
		},
		photoUrl: {
			type: String,
			default: null,
		},
		phoneNumber: {
			type: String,
			trim: true,
			default: null,
		},
		bio: {
			type: String,
			maxlength: [500, 'Bio cannot exceed 500 characters'],
			default: null,
		},
		isDarkMode: {
			type: Boolean,
			default: true,
		},
		locale: {
			type: String,
			default: 'en',
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		googleId: {
			type: String,
			default: null,
		},
		fcmToken: {
			type: String,
			default: null,
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ role: 1 });
userSchema.index({ googleId: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
	if (!this.isModified('password') || !this.password) {
		return next();
	}

	try {
		const salt = await bcrypt.genSalt(config.bcrypt.saltRounds);
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (error) {
		next(error);
	}
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
	if (!this.password) return false;
	return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to return user without sensitive data
userSchema.methods.toSafeObject = function () {
	const obj = this.toObject();
	delete obj.password;
	delete obj.googleId;
	delete obj.fcmToken;
	return obj;
};

// Virtual for user's properties
userSchema.virtual('properties', {
	ref: 'Property',
	localField: '_id',
	foreignField: 'ownerId',
});

const User = mongoose.model('User', userSchema);

module.exports = User;
