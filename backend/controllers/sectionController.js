// Section CRUD with per-section student counts. Writes are admin-only.

const Section = require('../models/Section');
const User = require('../models/User');
const Session = require('../models/Session');

exports.list = async (req, res) => {
  try {
    const sections = await Section.find()
      .populate('adviser', 'name email')
      .sort({ gradeLevel: 1, name: 1 });

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

exports.create = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const { name, gradeLevel, adviser } = req.body;

    if (!name || !gradeLevel) {
      return res.status(400).json({ message: 'name and gradeLevel are required' });
    }

    const exists = await Section.findOne({ name });

    if (exists) {
      return res.status(400).json({ message: 'A section with that name already exists' });
    }

    const sec = await Section.create({
      name,
      gradeLevel,
      adviser: adviser || null,
    });

    if (adviser) {
      await User.findByIdAndUpdate(adviser, {
        section: name,
        gradeSection: name,
        gradeLevel,
      });
    }

    res.status(201).json(sec);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.update = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const { name, gradeLevel, adviser, isActive } = req.body;

    const existingSection = await Section.findById(req.params.id);

    if (!existingSection) {
      return res.status(404).json({ message: 'Section not found' });
    }

    const oldSectionName = existingSection.name;
    const newSectionName = name || existingSection.name;
    const newGradeLevel = gradeLevel || existingSection.gradeLevel;

    const sec = await Section.findByIdAndUpdate(
      req.params.id,
      {
        name: newSectionName,
        gradeLevel: newGradeLevel,
        adviser: adviser || null,
        isActive,
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate('adviser', 'name email');

    await User.updateMany(
      {
        role: 'student',
        $or: [
          { section: oldSectionName },
          { gradeSection: oldSectionName },
        ],
      },
      {
        $set: {
          section: newSectionName,
          gradeSection: newSectionName,
          gradeLevel: newGradeLevel,
        },
      }
    );

    await User.updateMany(
      {
        role: 'parent',
        $or: [
          { section: oldSectionName },
          { gradeSection: oldSectionName },
        ],
      },
      {
        $set: {
          section: newSectionName,
          gradeSection: newSectionName,
          gradeLevel: newGradeLevel,
        },
      }
    );

    await Session.updateMany(
      { section: oldSectionName },
      {
        $set: {
          section: newSectionName,
        },
      }
    );

    if (adviser) {
      await User.updateMany(
        {
          role: 'teacher',
          $or: [
            { section: oldSectionName },
            { gradeSection: oldSectionName },
            { _id: adviser },
          ],
        },
        {
          $set: {
            section: newSectionName,
            gradeSection: newSectionName,
            gradeLevel: newGradeLevel,
          },
        }
      );
    }

    res.json(sec);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.remove = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const sec = await Section.findById(req.params.id);

    if (!sec) {
      return res.status(404).json({ message: 'Section not found' });
    }

    const count = await User.countDocuments({
      role: 'student',
      section: sec.name,
    });

    if (count > 0) {
      return res.status(400).json({
        message: `Cannot delete: ${count} students are still assigned to this section.`,
      });
    }

    await sec.deleteOne();

    res.json({ message: 'Section removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};