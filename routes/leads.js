const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Lead = require('../models/Lead');

router.use(protect);

// Helper to build query from filters
const buildQuery = (filters, user) => {
  const query = {};
  if (user.role !== 'admin') {
    query.assigned_to = user.id; // Employees see only assigned leads
  }

  // String fields: equals, contains
  ['email', 'company', 'city'].forEach(field => {
    if (filters[`${field}_equals`]) query[field] = filters[`${field}_equals`];
    if (filters[`${field}_contains`]) query[field] = { $regex: filters[`${field}_contains`], $options: 'i' };
  });

  // Enums: equals, in
  ['status', 'source'].forEach(field => {
    if (filters[`${field}_equals`]) query[field] = filters[`${field}_equals`];
    if (filters[`${field}_in`]) query[field] = { $in: filters[`${field}_in`].split(',') };
  });

  // Numbers: equals, gt, lt, between
  ['score', 'lead_value'].forEach(field => {
    if (filters[`${field}_equals`]) query[field] = Number(filters[`${field}_equals`]);
    if (filters[`${field}_gt`]) query[field] = { $gt: Number(filters[`${field}_gt`]) };
    if (filters[`${field}_lt`]) query[field] = { ...query[field], $lt: Number(filters[`${field}_lt`]) };
    if (filters[`${field}_between`]) {
      const [min, max] = filters[`${field}_between`].split(',').map(Number);
      query[field] = { $gte: min, $lte: max };
    }
  });

  // Dates: on, before, after, between
  ['created_at', 'last_activity_at'].forEach(field => {
    if (filters[`${field}_on`]) query[field] = new Date(filters[`${field}_on`]);
    if (filters[`${field}_before`]) query[field] = { $lt: new Date(filters[`${field}_before`]) };
    if (filters[`${field}_after`]) query[field] = { ...query[field], $gt: new Date(filters[`${field}_after`]) };
    if (filters[`${field}_between`]) {
      const [start, end] = filters[`${field}_between`].split(',').map(d => new Date(d));
      query[field] = { $gte: start, $lte: end };
    }
  });

  // Boolean
  if (filters.is_qualified_equals !== undefined) query.is_qualified = filters.is_qualified_equals === 'true';

  return query;
};

// POST /api/leads
router.post('/', async (req, res, next) => {
  try {
    const lead = new Lead({ ...req.body, created_by: req.user.id });
    await lead.save();
    res.status(201).json(lead);
  } catch (err) {
    next(err);
  }
});

// GET /api/leads - List with pagination/filters
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, ...filters } = req.query;
    const query = buildQuery(filters, req.user);
    const leads = await Lead.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('assigned_to', 'first_name last_name')
      .populate('created_by', 'first_name last_name');
    const total = await Lead.countDocuments(query);
    res.json({
      data: leads,
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/leads/:id
router.get('/:id', async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('assigned_to created_by');
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    if (req.user.role !== 'admin' && lead.assigned_to.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(lead);
  } catch (err) {
    next(err);
  }
});

// PUT /api/leads/:id
router.put('/:id', async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    if (req.user.role !== 'admin' && lead.assigned_to.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const updated = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/leads/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    if (req.user.role !== 'admin' && lead.assigned_to.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    next(err);
  }
});

// GET /api/leads/stats
router.get('/stats', async (req, res, next) => {
  try {
    const query = req.user.role !== 'admin' ? { assigned_to: req.user.id } : {};
    const stats = await Lead.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$lead_value' },
        },
      },
    ]);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

module.exports = router;