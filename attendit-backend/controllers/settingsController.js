const Settings = require('../models/Settings');

// GET /api/settings  — public-ish: needed by frontend to render the school name
exports.getSettings = async (req, res) => {
  try {
    let s = await Settings.findOne({ key: 'global' });
    if (!s) s = await Settings.create({ key: 'global' });
    res.json(s);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/settings  — admin only
exports.updateSettings = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  try {
    const allowed = [
      'schoolName', 'schoolType', 'academicYear',
      // Attendance Rules & Thresholds (Fig. 23)
      'lateCutoffTime', 'autoAbsentTime',
      'consecutiveAbsenceThreshold', 'warningTotalAbsences', 'criticalTotalAbsences',
      // Risk bands used by analytics + AI scoring
      'attendanceCriticalBelow', 'attendanceHighRiskBelow', 'attendanceModerateBelow',
      'contactEmail', 'contactPhone', 'address',
    ];
    const update = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    }
    const s = await Settings.findOneAndUpdate(
      { key: 'global' },
      { $set: update },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(s);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
