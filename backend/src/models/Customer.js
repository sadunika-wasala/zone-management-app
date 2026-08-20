const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    nic: {
      type: String,
      required: [true, 'NIC is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    policyAmount: {
      type: Number,
      required: [true, 'Policy amount is required'],
      min: [0, 'Policy amount cannot be negative'],
    },
    policyStartDate: {
      type: Date,
    },
    policyType: {
      type: String,
      enum: ['Health Plan', 'Retirement Plan', 'Education Plan'],
    },
    paymentFrequency: {
      type: String,
      enum: ['Monthly', 'Quarterly', 'Yearly'],
    },
    assignedAdvisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Assigned Advisor/Employee is required'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Customer', customerSchema);
