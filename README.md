# 💰 Expense Tracker

A modern and intuitive expense tracking application built with Next.js, featuring real-time updates, beautiful UI, and secure authentication.

## ✨ Features

- 📊 **Dashboard Overview**: Visual representation of your expenses
- 💳 **Transaction Management**: Add, view, and categorize expenses
- 🔐 **Secure Authentication**: Powered by Clerk
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile
- 🌙 **Modern UI**: Dark theme with neon accents
- 💾 **Database**: PostgreSQL with Prisma ORM
- 🔄 **Real-time Updates**: Instant reflection of changes

## 🚀 Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (NeonDB)
- **ORM**: Prisma
- **Authentication**: Clerk
- **Styling**: TailwindCSS
- **Icons**: React Icons

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- PostgreSQL database (We use NeonDB)
- Clerk account for authentication
- Git for version control

## 🛠️ Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/shivanshu814/Expense-Tracker.git
   cd Expense-Tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Database
   DATABASE_URL="your_postgresql_connection_string"

   # Clerk Auth
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
   ```

4. **Database Setup**
   ```bash
   # Run migrations
   npx prisma migrate dev
   
   # Generate Prisma Client
   npx prisma generate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Visit [http://localhost:3000](http://localhost:3000) to see the application

## 📱 Usage Guide

1. **Sign Up/Login**
   - Create a new account or login using Clerk authentication
   - You'll be redirected to the dashboard after successful authentication

2. **Dashboard**
   - View your expense overview
   - See recent transactions
   - Check total spending

3. **Add Expense**
   - Click the "+" button in navigation
   - Fill in expense details:
     - Amount
     - Description
     - Payment Mode
     - Category
     - Split details (optional)

4. **View Transactions**
   - Access complete transaction history
   - Filter by categories
   - Sort by date or amount

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/improvement`)
3. Make changes
4. Commit (`git commit -am 'Add new feature'`)
5. Push (`git push origin feature/improvement`)
6. Create a Pull Request

## 🐛 Known Issues

- None at the moment. Please report if you find any!

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Shivanshu Kashyap**
- GitHub: [@shivanshu814](https://github.com/shivanshu814)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Clerk](https://clerk.dev/)
- [Prisma](https://www.prisma.io/)
- [TailwindCSS](https://tailwindcss.com/)

---

⭐️ Star this repo if you find it helpful!
