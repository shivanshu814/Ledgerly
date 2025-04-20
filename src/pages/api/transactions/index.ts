import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Helper function to handle database errors
const handleDatabaseError = (error: unknown) => {
  console.error("Database error:", error);
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return "Database connection failed";
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return `Database error: ${error.code}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Test database connection
    await prisma.$connect();

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
        const errorMessage = handleDatabaseError(error);
        console.error("Error fetching transactions:", errorMessage);
        return res.status(500).json({ 
          error: "Failed to fetch transactions",
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
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
              email: req.body.email || "user@example.com",
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
        const errorMessage = handleDatabaseError(error);
        console.error("Error creating transaction:", errorMessage);
        return res.status(500).json({ 
          error: "Failed to create transaction",
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
      }
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    const errorMessage = handleDatabaseError(error);
    console.error("Unexpected error:", errorMessage);
    return res.status(500).json({ 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
} 