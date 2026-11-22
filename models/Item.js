const mongoose = require('mongoose');

const allowedCategories = [
  'Electronics',
  'ID Card',
  'Books',
  'Keys',
  'Bag',
  'Clothing',
  'Accessories',
  'Other'
];

const allowedCustodyLocations = [
  'With Finder',
  'Campus Security Desk',
  'Central Library Front Desk',
  'Student Affairs Office',
  'Department Reception',
  'Lost & Found Center'
];

const claimSchema = new mongoose.Schema({
  claimantUsername: {
    type: String,
    required: true,
    trim: true
  },
  claimantName: {
    type: String,
    required: true,
    trim: true
  },
  proofDetails: {
    type: String,
    required: [true, 'Proof of ownership details are required'],
    trim: true,
    minlength: [5, 'Proof details must be at least 5 characters'],
    maxlength: [500, 'Proof details cannot exceed 500 characters']
  },
  contact: {
    type: String,
    required: [true, 'Claimant contact info is required'],
    trim: true,
    maxlength: [100, 'Contact info cannot exceed 100 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewNote: {
    type: String,
    trim: true,
    default: ''
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  }
});

const itemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: {
      values: ['lost', 'found'],
      message: 'Type must be either "lost" or "found"'
    },
    required: [true, 'Report type is required']
  },
  title: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    minlength: [3, 'Item name must be at least 3 characters'],
    maxlength: [80, 'Item name cannot exceed 80 characters']
  },
  category: {
    type: String,
    enum: {
      values: allowedCategories,
      message: 'Invalid category'
    },
    required: [true, 'Category is required']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    minlength: [2, 'Location must be at least 2 characters'],
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  custodyLocation: {
    type: String,
    default: 'With Finder',
    trim: true
  },
  date: {
    type: String,
    required: [true, 'Date is required']
  },
  contact: {
    type: String,
    required: [true, 'Contact information is required'],
    trim: true,
    minlength: [5, 'Contact info must be at least 5 characters'],
    maxlength: [100, 'Contact info cannot exceed 100 characters']
  },
  ownerUsername: {
    type: String,
    required: true,
    trim: true
  },
  ownerName: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'claim_pending', 'returned'],
    default: 'active'
  },
  claims: [claimSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp prior to save
itemSchema.pre('save', function () {
  this.updatedAt = new Date();
});

module.exports = {
  Item: mongoose.model('Item', itemSchema),
  allowedCategories,
  allowedCustodyLocations
};
