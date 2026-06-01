import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Only the fields the UI actually renders — cuts payload size significantly
const TX_SELECT = {
  id: true,
  amount: true,
  description: true,
  paymentMode: true,
  category: true,
  isSplit: true,
  splitWith: true,
  date: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  // ── GET ────────────────────────────────────────────────────────────────────
  if (req.method === "GET") {
    const {
      startDate,
      endDate,
      paymentMode,
      search,
      page = "1",
      limit = "15",
      sortBy = "date",
      sortOrder = "desc",
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build where from indexed columns first so Postgres picks the right index
    const where: Record<string, unknown> = { userId };

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
      where.date = dateFilter;
    }
    if (paymentMode && paymentMode !== "all") where.paymentMode = paymentMode;
    if (search?.trim()) where.description = { contains: search.trim(), mode: "insensitive" };

    const validSortFields = ["date", "amount", "description"] as const;
    const sortField = validSortFields.includes(sortBy as any) ? sortBy : "date";
    const dir = sortOrder === "asc" ? "asc" : "desc";
    const orderBy = { [sortField]: dir };

    try {
      // One round-trip: count + page + SUM
      const [total, transactions, aggregate] = await prisma.$transaction([
        prisma.transaction.count({ where } as any),
        prisma.transaction.findMany({ where, orderBy, skip, take: limitNum, select: TX_SELECT } as any),
        prisma.transaction.aggregate({ where, _sum: { amount: true } } as any),
      ]);

      // Cache: private (auth'd) but allow browser to revalidate in background
      res.setHeader("Cache-Control", "private, max-age=0, stale-while-revalidate=30");

      return res.status(200).json({
        transactions,
        total,
        totalAmount: (aggregate as any)._sum?.amount ?? 0,
        page: pageNum,
        totalPages: Math.ceil((total as number) / limitNum),
        limit: limitNum,
      });
    } catch (err) {
      console.error("GET /api/transactions:", err);
      return res.status(500).json({ error: err instanceof Error ? err.message : "Query failed" });
    }
  }

  // ── POST ───────────────────────────────────────────────────────────────────
  if (req.method === "POST") {
    const { amount, description, paymentMode, isSplit, splitWith, category = "OTHER" } = req.body;

    if (!amount || !description || !paymentMode) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // Upsert user so we never need a separate lookup on writes
      const user = await prisma.user.upsert({
        where: { clerkId: userId },
        update: {},
        create: { id: userId, clerkId: userId, email: req.body.email || "user@example.com" },
        select: { id: true },
      });

      const transaction = await prisma.transaction.create({
        data: {
          amount: Number(amount),
          description: String(description).trim(),
          paymentMode: String(paymentMode),
          isSplit: Boolean(isSplit),
          splitWith: splitWith ? String(splitWith).trim() : null,
          category: String(category),
          date: new Date(),
          userId: user.id,
        },
        select: TX_SELECT,
      });

      return res.status(201).json(transaction);
    } catch (err) {
      console.error("POST /api/transactions:", err);
      return res.status(500).json({ error: err instanceof Error ? err.message : "Create failed" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
