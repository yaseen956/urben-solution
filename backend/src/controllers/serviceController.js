import Service from '../models/Service.js';

export const getServices = async (req, res) => {
  const { search = '', category = '', minPrice, maxPrice } = req.query;
  const query = { isActive: true };
  if (search) query.$text = { $search: search };
  if (category) query.category = category;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  const services = await Service.find(query).sort({ category: 1, title: 1 });
  res.json({ services });
};

export const createService = async (req, res) => {
  const payload = {
    ...req.body,
    tags: typeof req.body.tags === 'string' ? req.body.tags.split(',').map((tag) => tag.trim()) : req.body.tags,
    image: req.file ? `/uploads/${req.file.filename}` : req.body.image
  };
  const service = await Service.create(payload);
  res.status(201).json({ service });
};
