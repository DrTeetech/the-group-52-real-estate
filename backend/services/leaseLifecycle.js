const mongoose = require('mongoose');
const Lease = require('../models/Lease');
const Property = require('../models/Property');

// Safe to run in more than one server instance: each lease transition is conditional.
const expireEndedLeases = async () => {
  const now = new Date();
  const expiredCandidates = await Lease.find({ status: 'active', endDate: { $lte: now } }).select('_id property').limit(500);
  let expiredCount = 0;

  for (const candidate of expiredCandidates) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const expired = await Lease.findOneAndUpdate(
          { _id: candidate._id, status: 'active', endDate: { $lte: now } },
          { $set: { status: 'expired' } },
          { new: true, session }
        );
        if (!expired) return;

        const otherCurrentLease = await Lease.findOne({
          _id: { $ne: expired._id },
          property: expired.property,
          status: { $in: ['pending', 'active'] },
          endDate: { $gt: now },
        }).session(session);
        if (!otherCurrentLease) {
          await Property.updateOne(
            { _id: expired.property, status: 'rented' },
            { $set: { status: 'available', visibility: 'public' }, $unset: { reservedForApplication: '' } },
            { session }
          );
        }
        expiredCount += 1;
      });
    } finally {
      await session.endSession();
    }
  }

  if (expiredCount) console.log(`Lease lifecycle: marked ${expiredCount} lease(s) expired`);
  return expiredCount;
};

module.exports = { expireEndedLeases };
