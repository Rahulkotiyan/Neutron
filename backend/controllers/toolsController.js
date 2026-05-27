const crypto = require('crypto');
const { getDb, schema } = require('../db');
const { eq, and, asc } = require('drizzle-orm');

const now = () => new Date().toISOString();

const addId = (o) => { if (o && !o._id) o._id = o.id; return o; };
const mapIds = (arr) => { arr.forEach(addId); return arr; };

exports.getAllTools = async (req, res) => {
  try {
    const db = getDb();
    const categories = await db.select().from(schema.toolCategories).where(eq(schema.toolCategories.isActive, 1)).orderBy(asc(schema.toolCategories.displayOrder));

    const result = [];
    for (const cat of categories) {
      const subcategories = await db.select().from(schema.toolSubcategories).where(eq(schema.toolSubcategories.categoryId, cat.id)).orderBy(asc(schema.toolSubcategories.displayOrder));

      const subcatList = [];
      for (const sub of subcategories) {
        const toolList = await db.select().from(schema.tools).where(and(eq(schema.tools.subcategoryId, sub.id), eq(schema.tools.isActive, 1))).orderBy(asc(schema.tools.displayOrder));
        subcatList.push(addId({ ...sub, tools: mapIds(toolList) }));
      }

      result.push(addId({ ...cat, subcategories: subcatList }));
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Error fetching tools", error: err.message });
  }
};

exports.getCategoryTools = async (req, res) => {
  try {
    const { slug } = req.params;
    const db = getDb();
    const cat = (await db.select().from(schema.toolCategories).where(and(eq(schema.toolCategories.slug, slug), eq(schema.toolCategories.isActive, 1))).limit(1))[0];
    if (!cat) return res.status(404).json({ message: "Category not found" });

    const subcategories = await db.select().from(schema.toolSubcategories).where(eq(schema.toolSubcategories.categoryId, cat.id)).orderBy(asc(schema.toolSubcategories.displayOrder));

    const subcatList = [];
    for (const sub of subcategories) {
      const toolList = await db.select().from(schema.tools).where(and(eq(schema.tools.subcategoryId, sub.id), eq(schema.tools.isActive, 1))).orderBy(asc(schema.tools.displayOrder));
      subcatList.push(addId({ ...sub, tools: mapIds(toolList) }));
    }

    res.json(addId({ ...cat, subcategories: subcatList }));
  } catch (err) {
    res.status(500).json({ message: "Error fetching category", error: err.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, slug, icon } = req.body;
    if (!name || !slug || !icon) return res.status(400).json({ message: "name, slug, icon required" });
    const db = getDb();
    const id = crypto.randomUUID();
    await db.insert(schema.toolCategories).values({ id, name, slug, icon, createdAt: now() });
    res.status(201).json(addId({ id, name, slug, icon }));
  } catch (err) {
    res.status(500).json({ message: "Error creating category", error: err.message });
  }
};

exports.createSubcategory = async (req, res) => {
  try {
    const { categoryId, name, slug, icon } = req.body;
    if (!categoryId || !name || !slug) return res.status(400).json({ message: "categoryId, name, slug required" });
    const db = getDb();
    const id = crypto.randomUUID();
    await db.insert(schema.toolSubcategories).values({ id, categoryId, name, slug, icon, createdAt: now() });
    res.status(201).json(addId({ id, categoryId, name, slug, icon }));
  } catch (err) {
    res.status(500).json({ message: "Error creating subcategory", error: err.message });
  }
};

exports.createTool = async (req, res) => {
  try {
    const { subcategoryId, title, description, url, icon } = req.body;
    if (!subcategoryId || !title || !url) return res.status(400).json({ message: "subcategoryId, title, url required" });
    const db = getDb();
    const id = crypto.randomUUID();
    await db.insert(schema.tools).values({ id, subcategoryId, title, description, url, icon, createdAt: now() });
    res.status(201).json(addId({ id, subcategoryId, title, description, url, icon }));
  } catch (err) {
    res.status(500).json({ message: "Error creating tool", error: err.message });
  }
};

exports.deleteTool = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    await db.delete(schema.tools).where(eq(schema.tools.id, id));
    res.json({ message: "Tool deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting tool", error: err.message });
  }
};
