const crypto = require('crypto');
const { getDb, schema } = require('../db');
const { eq, or } = require('drizzle-orm');

exports.getBranches = async (req, res) => {
  try {
    const db = getDb();
    const branches = await db.select().from(schema.branches).where(eq(schema.branches.isActive, 1));
    res.json({ success: true, data: branches });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching branches" });
  }
};

exports.seedBranches = async (req, res) => {
  try {
    const db = getDb();
    await db.delete(schema.branches);
    const initialBranches = [
      { name: "Computer Science and Engineering", code: "CSE", isActive: 1 },
      { name: "Information Science and Engineering", code: "ISE", isActive: 1 },
      { name: "Electronics and Communication Engineering", code: "ECE", isActive: 1 },
      { name: "Electrical and Electronics Engineering", code: "EEE", isActive: 1 },
      { name: "Mechanical Engineering", code: "ME", isActive: 1 },
      { name: "Civil Engineering", code: "CE", isActive: 1 },
      { name: "Artificial Intelligence and Machine Learning", code: "AIML", isActive: 1 },
      { name: "Data Science", code: "DS", isActive: 1 },
    ].map(b => ({ ...b, id: crypto.randomUUID() }));
    await db.insert(schema.branches).values(initialBranches);
    const branches = await db.select().from(schema.branches);
    res.json({ success: true, message: "Branches seeded successfully", branches, count: branches.length });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error seeding branches" });
  }
};

exports.addBranch = async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) return res.status(400).json({ success: false, message: "Branch name and code are required" });
    const db = getDb();
    const existing = await db.select().from(schema.branches).where(or(eq(schema.branches.name, name.trim()), eq(schema.branches.code, code.trim().toUpperCase()))).limit(1);
    if (existing.length) return res.status(400).json({ success: false, message: "Branch name or code already exists" });
    const id = crypto.randomUUID();
    await db.insert(schema.branches).values({ id, name: name.trim(), code: code.trim().toUpperCase() });
    const branch = (await db.select().from(schema.branches).where(eq(schema.branches.id, id)).limit(1))[0];
    res.status(201).json({ success: true, data: branch });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error adding branch" });
  }
};

exports.updateBranchStatus = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') return res.status(400).json({ success: false, message: "isActive must be a boolean" });
    const db = getDb();
    const existing = await db.select().from(schema.branches).where(eq(schema.branches.id, branchId)).limit(1);
    if (!existing.length) return res.status(404).json({ success: false, message: "Branch not found" });
    await db.update(schema.branches).set({ isActive: isActive ? 1 : 0 }).where(eq(schema.branches.id, branchId));
    const branch = (await db.select().from(schema.branches).where(eq(schema.branches.id, branchId)).limit(1))[0];
    res.json({ success: true, data: branch });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error updating branch" });
  }
};

exports.deleteBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    const db = getDb();
    const existing = await db.select().from(schema.branches).where(eq(schema.branches.id, branchId)).limit(1);
    if (!existing.length) return res.status(404).json({ success: false, message: "Branch not found" });
    await db.delete(schema.branches).where(eq(schema.branches.id, branchId));
    res.json({ success: true, message: "Branch deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error deleting branch" });
  }
};
