import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    try {
      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
        },
        orderBy: {
          date: "desc",
        },
      });

      const totalExpense = transactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0
      );

      return res.status(200).json({ transactions, totalExpense });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return res.status(500).json({ error: "Failed to fetch transactions" });
    }
  }

  if (req.method === "POST") {
    try {
      const { amount, description, paymentMode, isSplit, date } = req.body;

      // Check if user exists, if not create one
      let user = await prisma.user.findUnique({
        where: { clerkId: userId },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            id: userId,
            clerkId: userId,
            email: req.body.email || "user@example.com", // Fallback email
          },
        });
      }

      const transactionData = {
        amount: parseFloat(amount),
        description,
        paymentMode,
        isSplit: Boolean(isSplit),
        date: new Date(date),
        userId: user.id
      };

      const transaction = await prisma.transaction.create({
        data: transactionData,
      });

      return res.status(201).json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      return res.status(500).json({ error: "Failed to create transaction" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
} 