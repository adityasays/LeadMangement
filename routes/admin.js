const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const User = require('../models/User');
const LeadSource = require('../models/LeadSource');
const Lead = require('../models/Lead');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

router.use(protect, admin);

router.post('/employees', async (req, res, next) => {
  try {
    const employee = new User({ ...req.body, role: 'employee' });
    await employee.save();
    res.status(201).json(employee);
  } catch (err) {
    next(err);
  }
});

router.get('/employees', async (req, res, next) => {
  try {
    const employees = await User.find({ role: 'employee' }).select('-password');
    res.json(employees);
  } catch (err) {
    next(err);
  }
});

router.put('/employees/:id', async (req, res, next) => {
  try {
    const employee = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    res.json(employee);
  } catch (err) {
    next(err);
  }
});

router.delete('/employees/:id', async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    next(err);
  }
});

router.post('/lead-sources', async (req, res, next) => {
  try {
    const source = new LeadSource(req.body);
    await source.save();
    res.status(201).json(source);
  } catch (err) {
    next(err);
  }
});

router.get('/lead-sources', async (req, res, next) => {
  try {
    const sources = await LeadSource.find();
    res.json(sources);
  } catch (err) {
    next(err);
  }
});

router.put('/lead-sources/:id', async (req, res, next) => {
  try {
    const source = await LeadSource.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(source);
  } catch (err) {
    next(err);
  }
});

router.delete('/lead-sources/:id', async (req, res, next) => {
  try {
    await LeadSource.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lead source deleted' });
  } catch (err) {
    next(err);
  }
});

router.post('/leads/bulk', upload.single('file'), async (req, res, next) => {
  try {
    const leads = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        leads.push({ ...row, created_by: req.user.id });
      })
      .on('end', async () => {
        await Lead.insertMany(leads);
        fs.unlinkSync(req.file.path);
        res.status(201).json({ message: `${leads.length} leads imported` });
      });
  } catch (err) {
    next(err);
  }
});

router.put('/leads/:id/assign', async (req, res, next) => {
  try {
    const { assigned_to } = req.body;
    const lead = await Lead.findByIdAndUpdate(req.params.id, { assigned_to }, { new: true });
    res.json(lead);
  } catch (err) {
    next(err);
  }
});

module.exports = router;