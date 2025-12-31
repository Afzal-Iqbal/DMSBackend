const Donation = require('../../models/Donation');
const Campaign = require('../../models/Campaign');

// Create a Donation
exports.createDonation = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Request body is missing" });
    }

    const { amount, type, category, paymentMethod, campaignId } = req.body;

    // Validation
    if (!amount || !type || !category) {
      return res.status(400).json({ message: "Please provide amount, type, and category" });
    }

    // Optional: Check if campaign exists
    if (campaignId) {
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
    }

    // 1. Create the donation record
    const donation = await Donation.create({
      donor: req.user.id, // ID comes from the 'protect' middleware
      campaign: campaignId || null,
      amount,
      type,
      category,
      paymentMethod
    });

    // 2. If it's for a specific campaign, update that campaign's raisedAmount
    if (campaignId) {
      await Campaign.findByIdAndUpdate(campaignId, {
        $inc: { raisedAmount: amount }
      });
    }

    res.status(201).json({ success: true, message: "Donation recorded successfully", data: donation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get current user's donations
exports.getMyDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user.id })
      .populate('campaign', 'title') // Shows the campaign name instead of just the ID
      .sort('-date');

    res.status(200).json({ success: true, data: donations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download Receipt
exports.downloadReceipt = async (req, res) => {
  try {
    const donationId = req.params.id;
    const donation = await Donation.findById(donationId).populate('donor', 'name email').populate('campaign', 'title');

    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    // Ensure the user requesting the receipt is the donor
    if (donation.donor._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to access this receipt" });
    }

    // Check if verified
    if (donation.status !== 'Verified') {
      return res.status(403).json({ message: "Receipt available only for verified donations." });
    }

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();

    const filename = `receipt-${donation._id}.pdf`;
    res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    // Design the Receipt
    doc.fontSize(25).text('Donation Receipt', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Receipt #: ${donation._id}`);
    doc.text(`Date: ${new Date(donation.date).toDateString()}`);
    doc.moveDown();

    doc.fontSize(14).text('Donor Details:', { underline: true });
    doc.fontSize(12).text(`Name: ${donation.donor.name}`);
    doc.text(`Email: ${donation.donor.email}`);
    doc.moveDown();

    doc.fontSize(14).text('Donation Details:', { underline: true });
    doc.text(`Amount: PKR ${donation.amount}`);
    doc.text(`Type: ${donation.type}`);
    doc.text(`Category: ${donation.category}`);
    if (donation.campaign) {
      doc.text(`Campaign: ${donation.campaign.title}`);
    }
    doc.text(`Payment Method: ${donation.paymentMethod}`);
    doc.moveDown();

    doc.fontSize(16).text('Status: VERIFIED', { align: 'center', color: 'green' });
    doc.fillColor('green').text('VERIFIED BY ADMIN', { align: 'center' });

    doc.end();

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};