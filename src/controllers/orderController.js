import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Helper: Generate order number
const generateOrderNumber = () => {
  return 'ORD-' + Date.now().toString().slice(-6) '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
};

// ===== GET all orders (with filters) =====
export const getOrders = async (req, res) => {
  try {
    const { status, search, limit = 50, offset = 0 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { shippingAddress: { contains: search } },
        { userId: { contains: search } },
      ];
    }
    const orders = await prisma.order.findMany({
      where,
      include: { items: true, user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });
    const total = await prisma.order.count({ where });
    const formatted = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      isGuest: !order.userId,
      guestEmail: order.user?.email || '',
      items: order.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image || '',
        size: item.size || '',
        color: item.color || '',
        sku: '',
      })),
      subtotal: order.subtotal,
      shipping: order.shippingCost,
      tax: order.tax,
      discount: order.discount,
      total: order.total,
      status: order.status,
      shippingAddress: order.shippingAddress ? JSON.parse(order.shippingAddress) : {},
      billingAddress: order.billingAddress ? JSON.parse(order.billingAddress) : order.shippingAddress ? JSON.parse(order.shippingAddress) : {},
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderNotes: order.notes || '',
      trackingNumber: '',
      estimatedDelivery: null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));
    res.json({ success: true, data: formatted, pagination: { total, limit: parseInt(limit), offset: parseInt(offset) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== GET order by ID =====
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, user: { select: { firstName: true, lastName: true, email: true } } },
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const formatted = {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      isGuest: !order.userId,
      guestEmail: order.user?.email || '',
      items: order.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image || '',
        size: item.size || '',
        color: item.color || '',
      })),
      subtotal: order.subtotal,
      shipping: order.shippingCost,
      tax: order.tax,
      discount: order.discount,
      total: order.total,
      status: order.status,
      shippingAddress: order.shippingAddress ? JSON.parse(order.shippingAddress) : {},
      billingAddress: order.billingAddress ? JSON.parse(order.billingAddress) : order.shippingAddress ? JSON.parse(order.shippingAddress) : {},
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderNotes: order.notes || '',
      trackingNumber: '',
      estimatedDelivery: null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== CREATE order =====
export const createOrder = async (req, res) => {
  try {
    const orderData = req.body;
    const {
      userId, isGuest, guestEmail,
      items, subtotal, shipping, tax, discount, total,
      status, shippingAddress, billingAddress,
      paymentMethod, paymentStatus, notes,
    } = orderData;

    const orderNumber = generateOrderNumber();

    // ✅ FIX: REMOVED `userId: userId || null` as Prisma uses the relation `user` below.
    const order = await prisma.order.create({
      data: {
        orderNumber,
        user: userId ? { connect: { id: userId } } : undefined,
        subtotal: subtotal || 0,
        shippingCost: shipping || 0,
        tax: tax || 0,
        discount: discount || 0,
        total: total || 0,
        status: status || 'pending',
        shippingAddress: JSON.stringify(shippingAddress),
        billingAddress: JSON.stringify(billingAddress || shippingAddress),
        paymentMethod: paymentMethod || 'card',
        paymentStatus: paymentStatus || 'pending',
        notes: notes || '',
        items: {
          create: items.map(item => ({
            productId: item.id || item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.size || '',
            color: item.color || '',
            image: item.image || '',
          })),
        },
      },
      include: { items: true },
    });

    const formatted = {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      isGuest: !order.userId,
      guestEmail: guestEmail || '',
      items: order.items,
      subtotal: order.subtotal,
      shipping: order.shippingCost,
      tax: order.tax,
      discount: order.discount,
      total: order.total,
      status: order.status,
      shippingAddress: JSON.parse(order.shippingAddress),
      billingAddress: JSON.parse(order.billingAddress),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderNotes: order.notes || '',
      trackingNumber: '',
      estimatedDelivery: null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
    res.status(201).json({ success: true, data: formatted });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== UPDATE order status (THIS WAS MISSING) =====
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'Status is required' });
    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    });
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== UPDATE payment status =====
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;
    const order = await prisma.order.update({
      where: { id },
      data: { paymentStatus },
      include: { items: true },
    });
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== DELETE order =====
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.order.delete({ where: { id } });
    res.json({ success: true, message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== GET order statistics =====
export const getOrderStats = async (req, res) => {
  try {
    const total = await prisma.order.count();
    const pending = await prisma.order.count({ where: { status: 'pending' } });
    const processing = await prisma.order.count({ where: { status: 'processing' } });
    const shipped = await prisma.order.count({ where: { status: 'shipped' } });
    const delivered = await prisma.order.count({ where: { status: 'delivered' } });
    const cancelled = await prisma.order.count({ where: { status: 'cancelled' } });
    const refunded = await prisma.order.count({ where: { status: 'refunded' } });
    const totalRevenue = await prisma.order.aggregate({ _sum: { total: true } });
    const avgOrderValue = total > 0 ? totalRevenue._sum.total / total : 0;
    res.json({
      success: true,
      data: {
        total,
        pending,
        processing,
        shipped,
        delivered,
        cancelled,
        refunded,
        totalRevenue: totalRevenue._sum.total || 0,
        averageOrderValue: avgOrderValue,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== GET dashboard stats =====
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const totalOrders = await prisma.order.count();
    const todayOrders = await prisma.order.count({ where: { createdAt: { gte: today, lt: tomorrow } } });
    const yesterdayOrders = await prisma.order.count({ where: { createdAt: { gte: yesterday, lt: today } } });
    const totalRevenueAgg = await prisma.order.aggregate({ _sum: { total: true } });
    const totalRevenue = totalRevenueAgg._sum.total || 0;
    const pending = await prisma.order.count({ where: { status: 'pending' } });
    const processing = await prisma.order.count({ where: { status: 'processing' } });
    const shipped = await prisma.order.count({ where: { status: 'shipped' } });
    const delivered = await prisma.order.count({ where: { status: 'delivered' } });
    const cancelled = await prisma.order.count({ where: { status: 'cancelled' } });
    const refunded = await prisma.order.count({ where: { status: 'refunded' } });
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const recentOrders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { items: { take: 3 } },
    });

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        todayOrders,
        yesterdayOrders,
        pendingOrders: pending,
        processingOrders: processing,
        shippedOrders: shipped,
        deliveredOrders: delivered,
        cancelledOrders: cancelled,
        refundedOrders: refunded,
        averageOrderValue: avgOrderValue,
        recentOrders,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== GET recent orders =====
export const getRecentOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { items: true, user: { select: { firstName: true, lastName: true, email: true } } },
    });
    const formatted = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      isGuest: !order.userId,
      guestEmail: order.user?.email || '',
      items: order.items,
      subtotal: order.subtotal,
      shipping: order.shippingCost,
      tax: order.tax,
      discount: order.discount,
      total: order.total,
      status: order.status,
      shippingAddress: JSON.parse(order.shippingAddress),
      billingAddress: JSON.parse(order.billingAddress),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderNotes: order.notes || '',
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== GET orders by date range =====
export const getOrdersByDateRange = async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) return res.status(400).json({ success: false, message: 'Start and end dates required' });
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: new Date(start),
          lte: new Date(end),
        },
      },
      include: { items: true },
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};