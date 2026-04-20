const prisma = require('../lib/prisma');

const toNumber = (v) => (typeof v === 'number' ? v : Number(v));

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

// Dashboard general (ventas/compras completadas y conteos)
const dashboard = async (req, res) => {
  try {
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);

    const purchaseWhere = { status: 'COMPLETED' };
    const saleWhere = { status: 'COMPLETED' };

    if (from) {
      purchaseWhere.purchasedAt = { ...(purchaseWhere.purchasedAt || {}), gte: from };
      saleWhere.saleDate = { ...(saleWhere.saleDate || {}), gte: from };
    }
    if (to) {
      purchaseWhere.purchasedAt = { ...(purchaseWhere.purchasedAt || {}), lte: to };
      saleWhere.saleDate = { ...(saleWhere.saleDate || {}), lte: to };
    }

    const [purchaseAgg, saleAgg, transactionsCount] = await Promise.all([
      prisma.purchase.aggregate({ _sum: { totalPrice: true }, _count: { id: true }, where: purchaseWhere }),
      prisma.sale.aggregate({ _sum: { totalPrice: true }, _count: { id: true }, where: saleWhere }),
      prisma.transaction.count({
        where: {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        purchases: {
          count: purchaseAgg._count?.id ?? 0,
          totalPrice: toNumber(purchaseAgg._sum?.totalPrice ?? 0),
        },
        sales: {
          count: saleAgg._count?.id ?? 0,
          totalPrice: toNumber(saleAgg._sum?.totalPrice ?? 0),
        },
        transactionsCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const stockAvailableByProduct = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, stock: { gt: 0 } },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { stock: 'desc' },
    });
    return res.status(200).json({ success: true, total: products.length, data: products });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const uniqueClients = async (req, res) => {
  try {
    const completedSales = await prisma.sale.groupBy({
      by: ['clientId'],
      where: { status: 'COMPLETED' },
      _count: { _all: true },
    });

    const clientIds = completedSales.map((s) => s.clientId);
    const clients = await prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, name: true, email: true, phone: true },
    });

    return res.status(200).json({ success: true, total: clients.length, data: clients });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const activeProviders = async (req, res) => {
  try {
    const providers = await prisma.provider.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true, phone: true },
    });
    return res.status(200).json({ success: true, total: providers.length, data: providers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const activeProducts = async (req, res) => {
  try {
    const count = await prisma.product.count({ where: { isActive: true } });
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, stock: true, price: true, isActive: true },
    });
    return res.status(200).json({ success: true, total: count, data: products });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const topClients = async (req, res) => {
  try {
    const salesByClient = await prisma.sale.groupBy({
      by: ['clientId'],
      where: { status: 'COMPLETED' },
      _count: { _all: true },
      _sum: { totalPrice: true },
      orderBy: { _count: { clientId: 'desc' } },
      take: 5,
    });

    const clientIds = salesByClient.map(s => s.clientId);
    const clients = await prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, name: true, email: true, phone: true },
    });

    const clientMap = new Map(clients.map(c => [c.id, c]));
    const data = salesByClient.map(s => ({
      ...clientMap.get(s.clientId),
      totalCompras: s._count._all,
      totalGastado: toNumber(s._sum?.totalPrice ?? 0),
    })).filter(c => c.id);

    return res.status(200).json({ success: true, total: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { dashboard, stockAvailableByProduct, uniqueClients, activeProviders, activeProducts, topClients };

