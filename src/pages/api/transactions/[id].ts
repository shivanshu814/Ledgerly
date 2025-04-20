import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    switch (req.method) {
      case "PUT":
        const { amount, description, paymentMode } = req.body;
        const updatedTransaction = await prisma.transaction.update({
          where: { id: id as string },
          data: {
            amount,
            description,
            paymentMode,
          },
        });
        return res.status(200).json(updatedTransaction);

      case "DELETE":
        await prisma.transaction.delete({
          where: { id: id as string },
        });
        return res.status(200).json({ message: "Transaction deleted" });

      default:
        return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
} 