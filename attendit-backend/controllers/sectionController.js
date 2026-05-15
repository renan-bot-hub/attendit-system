const Section = require('../models/Section');
const User = require('../models/User');

// GET /api/sections  — list (with student count + adviser populated)
exports.list = async (req, res) => {
  try {
    const sections = await Section.find().populate('adviser', 'name email').sort({ gradeLevel: 1, name: 1 });
    // Count student rows tied to each section name (we store section as a string on User)
    const counts = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: '$section', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [c._id, c.count]));
    res.json(sections.map((s) => ({
      ...s.toObject(),
      studentCount: countMap.get(s.name) || 0,
    })));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/sections  — admin creates a section
exports.create = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  try {
    const { name, gradeLevel, adviser } = req.body;
    if (!name || !gradeLevel) return res.status(400).json({ message: 'name and gradeLevel are required' });
    const exists = await Section.findOne({ name });
    if (exists) return res.status(400).json({ message: 'A section with that name already exists' });
    const sec = await Section.create({ name, gradeLevel, adviser: adviser || null });
    res.status(201).json(sec);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/sections/:id  — admin edit
exports.update = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  try {
    const { name, gradeLevel, adviser, isActive } = req.body;
    const sec = await Section.findByIdAndUpdate(
      req.params.id,
      { name, gradeLevel, adviser: adviser || null, isActive },
      { new: true, runValidators: true }
    ).populate('adviser', 'name email');
    if (!sec) return res.status(404).json({ message: 'Section not found' });
    res.json(sec);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/sections/:id  — admin (only if no students still assigned)
exports.remove = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  try {
    const sec = await Section.findById(req.params.id);
    if (!sec) return res.status(404).json({ message: 'Section not found' });
    const count = await User.countDocuments({ role: 'student', section: sec.name });
    if (count > 0) {
      return res.status(400).json({ message: `Cannot delete: ${count} students are still assigned to this section.` });
    }
    await sec.deleteOne();
    res.json({ message: 'Section removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
