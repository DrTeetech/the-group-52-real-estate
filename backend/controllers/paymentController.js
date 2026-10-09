const crypto = require('crypto');
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Lease = require('../models/Lease');

const paystackHeaders = () => ({
  Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
  'Content-Type': 'application/json',
});

const callPaystack = async (url, options = {}) => {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    const error = new Error('Online payments are not configured');
    error.statusCode = 503;
    throw error;
  }
  const response = await fetch(url, { ...options, headers: { ...paystackHeaders(), ...(options.headers || {}) } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.status !== true) {
    const error = new Error(payload.message || 'Payment provider request failed');
    error.statusCode = 502;
    throw error;
  }
  return payload.data;
};

const expectedLeaseAmount = (lease, type) => ({
  rent: lease.rentAmount,
  security_deposit: lease.securityDeposit,
  service_charge: lease.serviceCharge,
}[type]);

const addMonthsClamped = (date, months) => {
  const result = new Date(date);
  const originalDay = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(originalDay, lastDay));
  return result;
};

const getBillingPeriodKey = (lease, type, now = new Date()) => {
  if (type === 'security_deposit') return 'once';
  const period = type === 'rent' ? lease.rentPeriod : lease.serviceChargePeriod;
  const monthsPerCycle = period === 'yearly' ? 12 : 1;
  const start = new Date(lease.startDate);
  let cycles = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  cycles = Math.max(0, Math.floor(cycles / monthsPerCycle) * monthsPerCycle);
  let cycleStart = addMonthsClamped(start, cycles);
  if (cycleStart > now && cycles >= monthsPerCycle) {
    cycles -= monthsPerCycle;
    cycleStart = addMonthsClamped(start, cycles);
  }
  return cycleStart.toISOString().slice(0, 10);
};

const finalizeVerifiedPayment = async ({ reference, providerReference, amountMinor, currency, successful, paidAt }) => {
  const payment = await Payment.findOne({ reference, provider: 'paystack' });
  if (!payment) return { found: false };
  if (payment.status !== 'pending') return { found: true, payment, unchanged: true };

  const expectedMinor = Math.round(payment.amount * 100);
  if (successful && (amountMinor !== expectedMinor || currency !== payment.currency)) {
    console.error(`Paystack amount/currency mismatch for payment ${reference}`);
    return { found: true, mismatch: true, payment };
  }

  const update = successful
    ? { status: 'successful', providerReference: String(providerReference || reference), paidAt: paidAt ? new Date(paidAt) : new Date() }
    : { status: 'failed', providerReference: String(providerReference || reference), $unsetActiveKey: true };
  const updateQuery = { $set: { ...update } };
  if (updateQuery.$set.$unsetActiveKey) { delete updateQuery.$set.$unsetActiveKey; updateQuery.$unset = { activePaymentKey: '' }; }
  await Payment.updateOne({ _id: payment._id, status: 'pending' }, updateQuery);
  return { found: true, payment: await Payment.findById(payment._id) };
};

const createPaymentRecord = async (req, res, next) => {
  let payment;
  try {
    const { lease: leaseId, type, provider = 'paystack' } = req.body || {};
    if (!mongoose.isValidObjectId(leaseId)) return res.status(400).json({ success: false, message: 'A valid lease ID is required' });
    if (!['rent', 'security_deposit', 'service_charge'].includes(type)) return res.status(400).json({ success: false, message: 'Invalid payment type' });
    if (provider !== 'paystack') return res.status(400).json({ success: false, message: 'Paystack is the currently supported online payment provider' });

    const lease = await Lease.findById(leaseId);
    if (!lease || lease.tenant.toString() !== req.user._id.toString()) return res.status(404).json({ success: false, message: 'Lease not found' });
    if (lease.status !== 'active') return res.status(409).json({ success: false, message: 'Payments require an active lease' });
    if (lease.currency !== 'NGN') return res.status(400).json({ success: false, message: 'Paystack checkout is currently configured for NGN leases only' });

    const amount = expectedLeaseAmount(lease, type);
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ success: false, message: `There is no payable amount for ${type}` });
    if (!Number.isSafeInteger(Math.round(amount * 100))) return res.status(400).json({ success: false, message: 'Payment amount exceeds supported precision' });

    if (new Date() < lease.startDate || new Date() >= lease.endDate) {
      return res.status(409).json({ success: false, message: 'The lease is outside its active payment period' });
    }
    const billingPeriodKey = getBillingPeriodKey(lease, type);
    const activePaymentKey = `${lease._id.toString()}:${type}:${billingPeriodKey}`;
    // A unique active key prevents concurrent duplicate payments for the same billing period.
    payment = await Payment.findOne({ activePaymentKey });
    if (payment && payment.status === 'successful') {
      return res.status(409).json({ success: false, message: 'This payment period has already been paid', payment: { reference: payment.reference, status: payment.status, billingPeriodKey } });
    }
    if (payment && payment.authorizationUrl) {
      return res.status(200).json({ success: true, message: 'Existing pending checkout returned', payment: { id: payment._id, reference: payment.reference, amount: payment.amount, currency: payment.currency, status: payment.status, billingPeriodKey: payment.billingPeriodKey, authorizationUrl: payment.authorizationUrl, accessCode: payment.accessCode } });
    }
    if (!payment) {
      payment = await Payment.create({
        reference: `PAY-${new mongoose.Types.ObjectId().toString().toUpperCase()}`,
        user: req.user._id,
        property: lease.property,
        lease: lease._id,
        amount,
        currency: lease.currency,
        type,
        provider: 'paystack',
        status: 'pending',
        billingPeriodKey,
        activePaymentKey,
      });
    }

    const providerData = await callPaystack('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify({
        email: req.user.email,
        amount: String(Math.round(amount * 100)),
        currency: lease.currency,
        reference: payment.reference,
        callback_url: process.env.PAYSTACK_CALLBACK_URL || undefined,
        metadata: { paymentReference: payment.reference, leaseId: lease._id.toString(), paymentType: type },
      }),
    });

    payment.authorizationUrl = providerData.authorization_url;
    payment.accessCode = providerData.access_code;
    await payment.save();
    return res.status(201).json({
      success: true,
      message: 'Payment checkout initialized. Complete payment and verify it with the backend.',
      payment: { id: payment._id, reference: payment.reference, amount: payment.amount, currency: payment.currency, type: payment.type, billingPeriodKey: payment.billingPeriodKey, status: payment.status, authorizationUrl: payment.authorizationUrl, accessCode: payment.accessCode },
    });
  } catch (error) {
    if (payment && payment.status === 'pending' && !payment.authorizationUrl && error.statusCode) {
      payment.status = 'failed';
      payment.activePaymentKey = undefined;
      await payment.save().catch(() => {});
    }
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'A payment checkout already exists; refresh your payments and retry if necessary' });
    return next(error);
  }
};

const verifyMyPayment = async (req, res, next) => {
  try {
    const { reference } = req.params;
    const payment = await Payment.findOne({ reference, user: req.user._id, provider: 'paystack' });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (payment.status !== 'pending') return res.status(200).json({ success: true, payment });

    const providerData = await callPaystack(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { method: 'GET' });
    if (providerData.reference !== payment.reference) return res.status(409).json({ success: false, message: 'Payment reference mismatch' });
    const status = providerData.status;
    const definitiveFailure = ['failed', 'abandoned', 'reversed'].includes(status);
    const successful = status === 'success';
    if (!successful && !definitiveFailure) {
      return res.status(200).json({ success: true, message: 'Payment is still being processed', payment });
    }

    const result = await finalizeVerifiedPayment({
      reference: payment.reference,
      providerReference: providerData.id || providerData.reference,
      amountMinor: providerData.amount,
      currency: providerData.currency,
      successful,
      paidAt: providerData.paid_at,
    });
    if (result.mismatch) return res.status(409).json({ success: false, message: 'Provider payment amount or currency did not match the expected amount' });
    return res.status(200).json({ success: true, message: successful ? 'Payment verified' : 'Payment was not successful', payment: result.payment });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    return next(error);
  }
};

const paystackWebhook = async (req, res, next) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const signature = req.headers['x-paystack-signature'];
    if (!secret || !signature || !req.rawBody) return res.status(400).json({ success: false, message: 'Invalid webhook request' });
    const expected = crypto.createHmac('sha512', secret).update(req.rawBody).digest('hex');
    const suppliedBuffer = Buffer.from(String(signature));
    const expectedBuffer = Buffer.from(expected);
    if (suppliedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)) {
      return res.status(401).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = req.body;
    if (event && event.event === 'charge.success' && event.data) {
      const data = event.data;
      const result = await finalizeVerifiedPayment({
        reference: data.reference,
        providerReference: data.id || data.reference,
        amountMinor: data.amount,
        currency: data.currency,
        successful: data.status === 'success',
        paidAt: data.paid_at,
      });
      if (!result.found) console.warn('Paystack webhook received for unknown reference');
      if (result.mismatch) console.error(`Ignored mismatched Paystack webhook for ${data.reference}`);
    }
    return res.status(200).json({ received: true });
  } catch (error) { return next(error); }
};

const getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .select('-metadata -accessCode')
      .populate('property', 'title propertyCode')
      .populate('lease', 'leaseNumber rentAmount rentPeriod')
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: payments.length, payments });
  } catch (error) { return next(error); }
};

const getAllPayments = async (req, res, next) => {
  try {
    const filter = {};
    const statuses = ['pending', 'successful', 'failed', 'refunded'];
    if (req.query.status) {
      if (!statuses.includes(req.query.status)) return res.status(400).json({ success: false, message: 'Invalid payment status' });
      filter.status = req.query.status;
    }
    const page = Number.parseInt(req.query.page || '1', 10);
    const limit = Number.parseInt(req.query.limit || '20', 10);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({ success: false, message: 'page must be >= 1 and limit must be between 1 and 100' });
    }
    const [payments, total] = await Promise.all([
      Payment.find(filter).select('-metadata -accessCode').populate('user', 'firstName lastName email').populate('property', 'title propertyCode').populate('lease', 'leaseNumber').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Payment.countDocuments(filter),
    ]);
    return res.status(200).json({ success: true, count: payments.length, total, page, pages: Math.ceil(total / limit), payments });
  } catch (error) { return next(error); }
};

module.exports = { createPaymentRecord, verifyMyPayment, paystackWebhook, getMyPayments, getAllPayments };
