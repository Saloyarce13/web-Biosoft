const prisma = require('../lib/prisma');

const list = async (req, res) => {
  try {
    const { type, limit } = req.query;
    const take = Math.min(Number(limit || 50), 200);

    const where = {};
    if (type) where.type = type;

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        user: { select: { id: true, name: true, email: true } },
        purchase: { select: { id: true, status: true } },
        sale: { select: { id: true, status: true } },
      },
    });

    return res.status(200).json({ success: true, total: transactions.length, data: transactions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { list };

