const crypto = require('crypto');
const { getDb, schema } = require('../db');
const { eq, and, asc, inArray, sql, count } = require('drizzle-orm');

const now = () => new Date().toISOString();

const addId = (o) => { if (o && !o._id) o._id = o.id; return o; };
const mapIds = (arr) => { arr.forEach(addId); return arr; };

const enrichTools = async (toolList, userId) => {
  if (!toolList.length) return mapIds(toolList);
  const db = getDb();
  const toolIds = toolList.map(t => t.id);

  const starRows = await db.select({ toolId: schema.toolStars.toolId, cnt: count() })
    .from(schema.toolStars)
    .where(inArray(schema.toolStars.toolId, toolIds))
    .groupBy(schema.toolStars.toolId);

  const starMap = {};
  for (const r of starRows) starMap[r.toolId] = r.cnt;

  let userStarSet = new Set();
  if (userId) {
    const userStars = await db.select({ toolId: schema.toolStars.toolId })
      .from(schema.toolStars)
      .where(and(inArray(schema.toolStars.toolId, toolIds), eq(schema.toolStars.userId, userId)));
    userStarSet = new Set(userStars.map(r => r.toolId));
  }

  return mapIds(toolList.map(t => ({
    ...t,
    starCount: starMap[t.id] || 0,
    hasStarred: userId ? userStarSet.has(t.id) : false,
  })));
};

exports.getAllTools = async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user?._id;
    const categories = await db.select().from(schema.toolCategories).where(eq(schema.toolCategories.isActive, 1)).orderBy(asc(schema.toolCategories.displayOrder));
    if (!categories.length) return res.json([]);

    const catIds = categories.map(c => c.id);
    const allSubcategories = await db.select().from(schema.toolSubcategories)
      .where(inArray(schema.toolSubcategories.categoryId, catIds))
      .orderBy(asc(schema.toolSubcategories.displayOrder));
    if (!allSubcategories.length) return res.json(categories.map(c => addId({ ...c, subcategories: [] })));

    const subIds = allSubcategories.map(s => s.id);
    const allTools = await db.select().from(schema.tools)
      .where(and(inArray(schema.tools.subcategoryId, subIds), eq(schema.tools.isActive, 1)))
      .orderBy(asc(schema.tools.displayOrder));

    const enrichedTools = await enrichTools(allTools, userId);

    const toolsBySubcategory = {};
    for (const t of enrichedTools) {
      if (!toolsBySubcategory[t.subcategoryId]) toolsBySubcategory[t.subcategoryId] = [];
      toolsBySubcategory[t.subcategoryId].push(t);
    }

    const subcategoriesByCategory = {};
    for (const s of allSubcategories) {
      if (!subcategoriesByCategory[s.categoryId]) subcategoriesByCategory[s.categoryId] = [];
      subcategoriesByCategory[s.categoryId].push(addId({ ...s, tools: toolsBySubcategory[s.id] || [] }));
    }

    const result = categories.map(cat => addId({ ...cat, subcategories: subcategoriesByCategory[cat.id] || [] }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Error fetching tools", error: err.message });
  }
};

exports.getCategoryTools = async (req, res) => {
  try {
    const { slug } = req.params;
    const db = getDb();
    const userId = req.user?._id;
    const cat = (await db.select().from(schema.toolCategories).where(and(eq(schema.toolCategories.slug, slug), eq(schema.toolCategories.isActive, 1))).limit(1))[0];
    if (!cat) return res.status(404).json({ message: "Category not found" });

    const subcategories = await db.select().from(schema.toolSubcategories).where(eq(schema.toolSubcategories.categoryId, cat.id)).orderBy(asc(schema.toolSubcategories.displayOrder));
    if (!subcategories.length) return res.json(addId({ ...cat, subcategories: [] }));

    const subIds = subcategories.map(s => s.id);
    const allTools = await db.select().from(schema.tools)
      .where(and(inArray(schema.tools.subcategoryId, subIds), eq(schema.tools.isActive, 1)))
      .orderBy(asc(schema.tools.displayOrder));

    const enrichedTools = await enrichTools(allTools, userId);

    const toolsBySubcategory = {};
    for (const t of enrichedTools) {
      if (!toolsBySubcategory[t.subcategoryId]) toolsBySubcategory[t.subcategoryId] = [];
      toolsBySubcategory[t.subcategoryId].push(t);
    }

    const subcatList = subcategories.map(sub => addId({ ...sub, tools: toolsBySubcategory[sub.id] || [] }));
    res.json(addId({ ...cat, subcategories: subcatList }));
  } catch (err) {
    res.status(500).json({ message: "Error fetching category", error: err.message });
  }
};

exports.toggleStar = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const db = getDb();

    const tool = (await db.select().from(schema.tools).where(eq(schema.tools.id, id)).limit(1))[0];
    if (!tool) return res.status(404).json({ message: "Tool not found" });

    const existing = (await db.select().from(schema.toolStars)
      .where(and(eq(schema.toolStars.toolId, id), eq(schema.toolStars.userId, userId)))
      .limit(1))[0];

    if (existing) {
      await db.delete(schema.toolStars)
        .where(and(eq(schema.toolStars.toolId, id), eq(schema.toolStars.userId, userId)));
    } else {
      await db.insert(schema.toolStars).values({ toolId: id, userId, createdAt: now() });
    }

    const starRows = await db.select({ cnt: count() })
      .from(schema.toolStars)
      .where(eq(schema.toolStars.toolId, id));

    res.json({
      starred: !existing,
      starCount: starRows[0]?.cnt || 0,
      message: existing ? "Star removed" : "Star added",
    });
  } catch (err) {
    res.status(500).json({ message: "Error toggling star", error: err.message });
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
    const { categoryId, name, slug } = req.body;
    if (!categoryId || !name || !slug) return res.status(400).json({ message: "categoryId, name, slug required" });
    const db = getDb();
    const id = crypto.randomUUID();
    await db.insert(schema.toolSubcategories).values({ id, categoryId, name, slug, createdAt: now() });
    res.status(201).json(addId({ id, categoryId, name, slug }));
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
