import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    role: {
      type: String,
      enum: ['worker', 'customer'],
      default: 'customer',
      required: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    location: {
      village: { type: String, trim: true },
      district: { type: String, trim: true },
      state: { type: String, trim: true },
    },

    // Worker-specific fields
    profession: {
      type: String,
      trim: true,
    },
    experience: {
      type: Number,
      min: [0, 'Experience cannot be negative'],
    },
    availability:{
      type: Boolean,
      required: true
    },
    // General fields
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5'],
    },
    profileImage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Optional index to optimize worker queries by location or profession
userSchema.index({ role: 1, 'location.district': 1, profession: 1 });

const User = mongoose.model('User', userSchema);
export default User;