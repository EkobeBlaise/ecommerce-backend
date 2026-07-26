import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ===== GET all customers (users with role 'user' or 'admin') with stats =====
export const getCustomers = async (req, res) => {
  try {
    // Fetch users with their orders to compute stats
    const users = await prisma.user.findMany({
      where: {
        role: { in: ['user', 'admin'] }, // include both
      },
      include: {
        orders: {
          select: {
            total: true,
            status: true,
          },
        },
        addresses: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map to frontend Customer structure
    const customers = users.map(user => {
      const totalOrders = user.orders.length;
      const totalSpent = user.orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0), 0);
      return {
        id: user.id,
        first_name: user.firstName || '',
        last_name: user.lastName || '',
        email: user.email,
        role: user.role,
        status: user.isVerified ? 'active' : 'inactive', // map to customer status
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        totalOrders,
        totalSpent,
        addresses: user.addresses.map(addr => ({
          ...addr,
          // ensure frontend fields match
        })),
        wishlist: [], // not stored in this model, can be added later
        newsletter: false, // not stored yet
      };
    });

    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== GET customer by ID with stats =====
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        orders: {
          select: { total: true, status: true },
        },
        addresses: true,
      },
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    const totalOrders = user.orders.length;
    const totalSpent = user.orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0), 0);
    const customer = {
      id: user.id,
      first_name: user.firstName || '',
      last_name: user.lastName || '',
      email: user.email,
      role: user.role,
      status: user.isVerified ? 'active' : 'inactive',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      totalOrders,
      totalSpent,
      addresses: user.addresses,
      wishlist: [],
      newsletter: false,
    };
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== GET customer stats (overall) =====
export const getCustomerStats = async (req, res) => {
  try {
    const totalCustomers = await prisma.user.count({
      where: { role: { in: ['user', 'admin'] } },
    });
    const activeCustomers = await prisma.user.count({
      where: { role: { in: ['user', 'admin'] }, isVerified: true },
    });
    // Inactive are unverified
    const inactiveCustomers = totalCustomers - activeCustomers;
    // Suspended – not supported yet, default 0
    const suspendedCustomers = 0;

    // Total revenue from all orders (non-cancelled)
    const orders = await prisma.order.findMany({
      where: { status: { not: 'cancelled' } },
      select: { total: true },
    });
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = await prisma.order.count();
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    res.json({
      success: true,
      data: {
        totalCustomers,
        activeCustomers,
        inactiveCustomers,
        suspendedCustomers,
        totalRevenue,
        averageOrderValue,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== GET top customers by spending =====
export const getTopCustomers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    // Aggregate orders by user
    const users = await prisma.user.findMany({
      where: { role: { in: ['user', 'admin'] } },
      include: {
        orders: {
          where: { status: { not: 'cancelled' } },
          select: { total: true },
        },
      },
    });
    // Compute total spent per user and sort
    const withSpent = users.map(user => ({
      ...user,
      totalSpent: user.orders.reduce((sum, o) => sum + o.total, 0),
      orderCount: user.orders.length,
    }));
    const sorted = withSpent.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, limit);
    // Map to customer format
    const customers = sorted.map(user => ({
      id: user.id,
      first_name: user.firstName || '',
      last_name: user.lastName || '',
      email: user.email,
      role: user.role,
      status: user.isVerified ? 'active' : 'inactive',
      totalOrders: user.orderCount,
      totalSpent: user.totalSpent,
    }));
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== GET recent customers =====
export const getRecentCustomers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const users = await prisma.user.findMany({
      where: { role: { in: ['user', 'admin'] } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        orders: { select: { total: true, status: true } },
      },
    });
    const customers = users.map(user => ({
      id: user.id,
      first_name: user.firstName || '',
      last_name: user.lastName || '',
      email: user.email,
      role: user.role,
      status: user.isVerified ? 'active' : 'inactive',
      createdAt: user.createdAt,
      totalOrders: user.orders.length,
      totalSpent: user.orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0), 0),
    }));
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== UPDATE customer status (admin only) =====
export const updateCustomerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "active" or "inactive" or "suspended"
    // Map customer status to User.isVerified and maybe a new field
    // For now, we only have isVerified, so we'll treat active = verified, inactive = not verified
    const isVerified = status === 'active';
    const user = await prisma.user.update({
      where: { id },
      data: { isVerified },
    });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};