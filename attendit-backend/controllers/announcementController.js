// School-wide notices (Fig. 15). Admin/staff publish; everyone reads;
// admin can delete.

const Announcement = require('../models/Announcement');

exports.list = async (req, res) => {
  try {
    const filter = { status: 'Published' };
    if (req.user.role === 'admin' && req.query.includeDrafts === 'true') {
      delete filter.status;
    }
    const items = await Announcement.find(filter)
      .populate('postedBy', 'name role')
      .sort({ publishedAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.create = async (req, res) => {
  if (!['admin', 'staff'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Admin or staff access required' });
  }
  try {
    const { title, body, targetSections, status } = req.body;
    if (!title || !body) return res.status(400).json({ message: 'Title and body are required' });

    const item = await Announcement.create({
      title, body,
      targetSections: Array.isArray(targetSections) ? targetSections : [],
      status: status === 'Draft' ? 'Draft' : 'Published',
      postedBy: req.user.id,
      publishedAt: new Date(),
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const item = await Announcement.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Announcement not found' });

    if (req.user.role !== 'admin' && item.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Cannot edit another user\'s announcement' });
    }
    const { title, body, targetSections, status } = req.body;
    if (title !== undefined) item.title = title;
    if (body  !== undefined) item.body  = body;
    if (targetSections !== undefined) item.targetSections = targetSections;
    if (status !== undefined) item.status = status;
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.remove = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  try {
    const item = await Announcement.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Announcement not found' });
    res.json({ message: 'Announcement removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
