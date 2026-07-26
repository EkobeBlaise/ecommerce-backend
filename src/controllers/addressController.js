import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ===== GET addresses by user ID =====
export const getAddressesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });
    res.json({ success: true, data: addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== GET address by ID =====
export const getAddressById = async (req, res) => {
  try {
    const { id } = req.params;
    const address = await prisma.address.findUnique({ where: { id } });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    res.json({ success: true, data: address });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== CREATE address =====
export const createAddress = async (req, res) => {
  try {
    const data = req.body;
    
    // If this is set as default, unset other defaults
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: data.userId },
        data: { isDefault: false },
      });
    }
    
    const address = await prisma.address.create({ data });
    res.status(201).json({ success: true, data: address });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== UPDATE address =====
export const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    // If setting as default, unset other defaults
    if (data.isDefault) {
      const existing = await prisma.address.findUnique({ where: { id } });
      if (existing) {
        await prisma.address.updateMany({
          where: { userId: existing.userId },
          data: { isDefault: false },
        });
      }
    }
    
    const address = await prisma.address.update({
      where: { id },
      data,
    });
    res.json({ success: true, data: address });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== DELETE address =====
export const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.address.delete({ where: { id } });
    res.json({ success: true, message: 'Address deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== SET DEFAULT address =====
export const setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const address = await prisma.address.findUnique({ where: { id } });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    
    await prisma.address.updateMany({
      where: { userId: address.userId },
      data: { isDefault: false },
    });
    
    const updated = await prisma.address.update({
      where: { id },
      data: { isDefault: true },
    });
    
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};