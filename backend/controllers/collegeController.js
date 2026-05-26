const crypto = require('crypto');
const { getDb, schema } = require('../db');
const { eq } = require('drizzle-orm');

exports.getColleges = async (req, res) => {
  try {
    const db = getDb();
    const colleges = await db.select().from(schema.colleges).where(eq(schema.colleges.isActive, 1));
    res.status(200).json({ success: true, data: colleges, message: "Colleges fetched successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching colleges", error: err.message });
  }
};

exports.seedColleges = async (req, res) => {
  try {
    const db = getDb();
    await db.delete(schema.colleges);
    const id = crypto.randomUUID();
    await db.insert(schema.colleges).values({ id, name: "Dr Ambedkar Institute Of Technology", isActive: 1 });
    const colleges = await db.select().from(schema.colleges);
    res.status(200).json({ success: true, data: { colleges, count: colleges.length }, message: "Colleges seeded successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error seeding colleges", error: err.message });
  }
};

exports.addCollege = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "College name is required" });
    const db = getDb();
    const existing = await db.select().from(schema.colleges).where(eq(schema.colleges.name, name.trim())).limit(1);
    if (existing.length) return res.status(400).json({ success: false, message: "College already exists" });
    const id = crypto.randomUUID();
    await db.insert(schema.colleges).values({ id, name: name.trim() });
    const college = (await db.select().from(schema.colleges).where(eq(schema.colleges.id, id)).limit(1))[0];
    res.status(201).json({ success: true, data: college, message: "College added successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error adding college", error: err.message });
  }
};

exports.updateCollegeStatus = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') return res.status(400).json({ success: false, message: "isActive must be a boolean" });
    const db = getDb();
    const existing = await db.select().from(schema.colleges).where(eq(schema.colleges.id, collegeId)).limit(1);
    if (!existing.length) return res.status(404).json({ success: false, message: "College not found" });
    await db.update(schema.colleges).set({ isActive: isActive ? 1 : 0 }).where(eq(schema.colleges.id, collegeId));
    const college = (await db.select().from(schema.colleges).where(eq(schema.colleges.id, collegeId)).limit(1))[0];
    res.status(200).json({ success: true, data: college, message: "College status updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error updating college", error: err.message });
  }
};

exports.deleteCollege = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const db = getDb();
    const existing = await db.select().from(schema.colleges).where(eq(schema.colleges.id, collegeId)).limit(1);
    if (!existing.length) return res.status(404).json({ success: false, message: "College not found" });
    await db.delete(schema.colleges).where(eq(schema.colleges.id, collegeId));
    res.status(200).json({ success: true, message: "College deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error deleting college", error: err.message });
  }
};
