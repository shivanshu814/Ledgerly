import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.query as { id: string };
  if (!id) return res.status(400).json({ error: "Missing id" });

  // Resolve internal userId once
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!user) return res.status(404).json({ error: "User not found" });

  if (req.method === "PUT") {
    const { amount, description, paymentMode, category } = req.body;
    try {
      // Verify ownership in the same query — no separate lookup
      const updated = await prisma.transaction.updateMany({
        where: { id, userId: user.id },
        data: {
          ...(amount !== undefined && { amount: Number(amount) }),
          ...(description !== undefined && { description: String(description).trim() }),
          ...(paymentMode !== undefined && { paymentMode: String(paymentMode) }),
          ...(category !== undefined && { category: String(category) }),
        },
      });
      if (updated.count === 0) return res.status(404).json({ error: "Not found or not yours" });
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("PUT /api/transactions/[id]:", err);
      return res.status(500).json({ error: "Update failed" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const deleted = await prisma.transaction.deleteMany({
        where: { id, userId: user.id },
      });
      if (deleted.count === 0) return res.status(404).json({ error: "Not found or not yours" });
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("DELETE /api/transactions/[id]:", err);
      return res.status(500).json({ error: "Delete failed" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
