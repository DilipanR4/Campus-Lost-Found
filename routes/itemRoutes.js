const express = require('express');
const router = express.Router();
const { Item, allowedCategories, allowedCustodyLocations } = require('../models/Item');
const { authenticate, optionalAuth } = require('../middleware/auth');

function cleanText(val, maxLen) {
  return typeof val === 'string' ? val.trim().replace(/\s+/g, ' ').slice(0, maxLen) : '';
}

function validateItemInput(input) {
  const item = {
    type: cleanText(input.type, 10).toLowerCase(),
    title: cleanText(input.title, 80),
    category: cleanText(input.category, 30),
    description: cleanText(input.description, 500),
    location: cleanText(input.location, 100),
    custodyLocation: cleanText(input.custodyLocation, 60),
    date: cleanText(input.date, 10),
    contact: cleanText(input.contact, 100)
  };

  const errors = [];
  if (!['lost', 'found'].includes(item.type)) errors.push('Choose Lost or Found.');
  if (item.title.length < 3) errors.push('Item name must contain at least 3 characters.');
  if (!allowedCategories.includes(item.category)) errors.push('Choose a valid category.');
  if (item.description.length < 10) errors.push('Description must contain at least 10 characters.');
  if (item.location.length < 2) errors.push('Location is required.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date)) errors.push('Enter a valid date (YYYY-MM-DD).');
  if (item.contact.length < 5) errors.push('Contact information is required.');

  if (item.type === 'found' && !item.custodyLocation) {
    item.custodyLocation = 'With Finder';
  }

  return { item, errors };
}

// GET /api/items - list all reports
router.get('/', optionalAuth, async (req, res) => {
  try {
    const rawItems = await Item.find().sort({ createdAt: -1 });
    const currentUsername = req.user ? req.user.username : null;
    const isAdmin = req.user && req.user.role === 'admin';

    const items = rawItems.map((doc) => {
      const obj = doc.toObject();
      const isOwner = Boolean(currentUsername && obj.ownerUsername === currentUsername);
      const canManageClaims = isOwner || isAdmin;

      // Filter claims to protect privacy
      const allClaims = Array.isArray(obj.claims) ? obj.claims : [];
      const userClaim = currentUsername
        ? allClaims.find((c) => c.claimantUsername === currentUsername)
        : null;

      let visibleClaims = [];
      if (canManageClaims) {
        visibleClaims = allClaims;
      } else if (userClaim) {
        visibleClaims = [userClaim];
      }

      return {
        ...obj,
        id: obj._id.toString(),
        isOwner,
        claimsCount: allClaims.length,
        pendingClaimsCount: allClaims.filter((c) => c.status === 'pending').length,
        claims: visibleClaims,
        myClaim: userClaim || null
      };
    });

    return res.status(200).json({ items });
  } catch (error) {
    console.error('Error fetching items:', error);
    return res.status(500).json({ message: 'Error retrieving items from database.' });
  }
});

// POST /api/items - create a new report
router.post('/', authenticate, async (req, res) => {
  try {
    const { item, errors } = validateItemInput(req.body);
    if (errors.length) {
      return res.status(400).json({ message: errors.join(' ') });
    }

    const newItem = await Item.create({
      ...item,
      custodyLocation: item.type === 'found' ? item.custodyLocation : '',
      ownerUsername: req.user.username,
      ownerName: req.user.name,
      status: 'active',
      claims: []
    });

    const itemObj = newItem.toObject();
    itemObj.id = itemObj._id.toString();
    itemObj.isOwner = true;
    itemObj.claimsCount = 0;
    itemObj.pendingClaimsCount = 0;
    itemObj.claims = [];
    itemObj.myClaim = null;

    return res.status(201).json({
      message: 'Item reported successfully.',
      item: itemObj
    });
  } catch (error) {
    console.error('Error creating item:', error);
    return res.status(500).json({ message: error.message || 'Error saving report.' });
  }
});

// PUT /api/items/:id/status - mark as returned, reopen, or set status
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const cleanStatus = cleanText(status, 20).toLowerCase();

    if (!['active', 'claim_pending', 'returned'].includes(cleanStatus)) {
      return res.status(400).json({ message: 'Status must be "active", "claim_pending", or "returned".' });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    const isOwner = item.ownerUsername === req.user.username;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'You only have permission to update your own reports.' });
    }

    item.status = cleanStatus;
    item.updatedAt = new Date();
    await item.save();

    const itemObj = item.toObject();
    itemObj.id = itemObj._id.toString();
    itemObj.isOwner = isOwner;

    return res.status(200).json({
      message: cleanStatus === 'returned' ? 'Item marked as returned.' : 'Item status updated.',
      item: itemObj
    });
  } catch (error) {
    console.error('Error updating item status:', error);
    return res.status(500).json({ message: error.message || 'Error updating report status.' });
  }
});

// POST /api/items/:id/claim - submit a claim for a found item
router.post('/:id/claim', authenticate, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    if (item.type !== 'found') {
      return res.status(400).json({ message: 'Claims can only be filed on "Found" items.' });
    }

    if (item.status === 'returned') {
      return res.status(400).json({ message: 'This item has already been marked as returned to its owner.' });
    }

    if (item.ownerUsername === req.user.username) {
      return res.status(400).json({ message: 'You cannot file a claim on an item that you reported finding.' });
    }

    const proofDetails = cleanText(req.body.proofDetails, 500);
    const contact = cleanText(req.body.contact, 100);

    if (proofDetails.length < 5) {
      return res.status(400).json({ message: 'Please describe distinguishing details or proof of ownership (at least 5 characters).' });
    }
    if (contact.length < 5) {
      return res.status(400).json({ message: 'Please provide valid contact information.' });
    }

    // Check if user already has an active pending claim
    const existingPending = item.claims.find(
      (c) => c.claimantUsername === req.user.username && c.status === 'pending'
    );
    if (existingPending) {
      return res.status(400).json({ message: 'You already have a pending claim under review for this item.' });
    }

    const newClaim = {
      claimantUsername: req.user.username,
      claimantName: req.user.name,
      proofDetails,
      contact,
      status: 'pending',
      submittedAt: new Date()
    };

    item.claims.push(newClaim);
    item.status = 'claim_pending';
    item.updatedAt = new Date();
    await item.save();

    return res.status(201).json({
      message: 'Claim submitted successfully! The finder or campus administrator will review your proof.',
      item
    });
  } catch (error) {
    console.error('Error submitting claim:', error);
    return res.status(500).json({ message: error.message || 'Error submitting claim.' });
  }
});

// PUT /api/items/:id/claims/:claimId - approve or reject a claim
router.put('/:id/claims/:claimId', authenticate, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    const isOwner = item.ownerUsername === req.user.username;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Only the reporter or an administrator can review claims.' });
    }

    const claim = item.claims.id(req.params.claimId);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found.' });
    }

    const { decision, reviewNote } = req.body;
    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be "approve" or "reject".' });
    }

    claim.reviewedAt = new Date();
    claim.reviewNote = cleanText(reviewNote, 200);

    if (decision === 'approve') {
      claim.status = 'approved';
      // Mark item as returned
      item.status = 'returned';
      // Reject any other pending claims
      item.claims.forEach((c) => {
        if (c._id.toString() !== req.params.claimId && c.status === 'pending') {
          c.status = 'rejected';
          c.reviewNote = 'Item claimed and returned to another claimant.';
          c.reviewedAt = new Date();
        }
      });
    } else {
      claim.status = 'rejected';
      // If no remaining pending claims, return status to active
      const remainingPending = item.claims.some((c) => c.status === 'pending');
      if (!remainingPending && item.status === 'claim_pending') {
        item.status = 'active';
      }
    }

    item.updatedAt = new Date();
    await item.save();

    return res.status(200).json({
      message: decision === 'approve'
        ? 'Claim approved! Item has been marked as returned to claimant.'
        : 'Claim rejected.',
      item
    });
  } catch (error) {
    console.error('Error reviewing claim:', error);
    return res.status(500).json({ message: error.message || 'Error reviewing claim.' });
  }
});

// GET /api/items/:id/matches - Smart auto-match between Lost and Found items
router.get('/:id/matches', optionalAuth, async (req, res) => {
  try {
    const target = await Item.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    // Look for opposite type (if lost, search found; if found, search lost)
    const oppositeType = target.type === 'lost' ? 'found' : 'lost';
    const candidates = await Item.find({
      type: oppositeType,
      status: { $ne: 'returned' }
    });

    // Helper: tokenize text into meaningful words
    const tokenize = (text) =>
      (text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 3 && !['the', 'and', 'with', 'for', 'near', 'from', 'room', 'block'].includes(w));

    const targetWords = new Set([...tokenize(target.title), ...tokenize(target.description)]);
    const targetLocWords = new Set(tokenize(target.location));

    const scored = candidates.map((cand) => {
      let score = 0;
      const reasons = [];

      // Category match
      if (cand.category === target.category) {
        score += 45;
        reasons.push(`Same category (${cand.category})`);
      }

      // Keyword match in title & description
      const candWords = tokenize(`${cand.title} ${cand.description}`);
      let keywordHits = 0;
      candWords.forEach((word) => {
        if (targetWords.has(word)) keywordHits++;
      });
      if (keywordHits > 0) {
        const wordPoints = Math.min(keywordHits * 15, 45);
        score += wordPoints;
        reasons.push(`${keywordHits} matching keyword${keywordHits > 1 ? 's' : ''}`);
      }

      // Location match
      const candLocWords = tokenize(cand.location);
      let locHit = false;
      candLocWords.forEach((lw) => {
        if (targetLocWords.has(lw)) locHit = true;
      });
      if (locHit) {
        score += 20;
        reasons.push('Similar campus location');
      }

      return {
        item: {
          id: cand._id.toString(),
          title: cand.title,
          type: cand.type,
          category: cand.category,
          location: cand.location,
          custodyLocation: cand.custodyLocation,
          date: cand.date,
          contact: cand.contact,
          ownerName: cand.ownerName,
          status: cand.status
        },
        score: Math.min(score, 100),
        reasons
      };
    });

    // Filter only matches with score >= 40 and sort highest first
    const matches = scored
      .filter((m) => m.score >= 40)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return res.status(200).json({ matches });
  } catch (error) {
    console.error('Error finding matches:', error);
    return res.status(500).json({ message: 'Error computing matches.' });
  }
});

// DELETE /api/items/:id - delete report (admin or owner)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    const isOwner = item.ownerUsername === req.user.username;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'You do not have permission to delete this report.' });
    }

    await Item.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: 'Report removed successfully.' });
  } catch (error) {
    console.error('Error deleting item:', error);
    return res.status(500).json({ message: error.message || 'Error deleting report.' });
  }
});

module.exports = router;
