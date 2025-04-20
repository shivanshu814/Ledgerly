import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.method === "GET") {
      try {
        const transactions = await prisma.transaction.findMany({
          where: {
            userId: userId,
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
        return res.status(500).json({ 
          error: "Failed to fetch transactions",
          details: process.env.NODE_ENV === 'development' ? 
            error instanceof Error ? error.message : String(error) 
            : undefined 
        });
      }
    }

    if (req.method === "POST") {
      try {
        const { amount, description, paymentMode, isSplit, splitWith, category = "OTHER" } = req.body;

        if (!amount || !description || !paymentMode) {
          return res.status(400).json({
            error: "Missing required fields",
          });
        }

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
          amount: Number(amount),
          description,
          paymentMode,
          isSplit: Boolean(isSplit),
          splitWith: splitWith || null,
          category: category,
          date: new Date(),
          userId: user.id
        };

        const transaction = await prisma.transaction.create({
          data: transactionData,
        });

        return res.status(201).json(transaction);
      } catch (error) {
        console.error("Error creating transaction:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          return res.status(400).json({ 
            error: "Failed to create transaction",
            code: error.code,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined 
          });
        }
        return res.status(500).json({ 
          error: "Failed to create transaction",
          details: process.env.NODE_ENV === 'development' ? 
            error instanceof Error ? error.message : String(error) 
            : undefined 
        });
      }
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? 
        error instanceof Error ? error.message : String(error) 
        : undefined 
    });
  }
} 