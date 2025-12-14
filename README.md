# 🧾 IpBok

**IpBok** is a lightweight agent-based accounting and transaction tracking system built with **Next.js** and **Prisma**. It helps business owners and agents record daily cash and bank activity, reconcile balances, and view key financial insights — all in a simple, scalable platform. :contentReference[oaicite:1]{index=1}

---

## 🚀 Features

- **Role-based user system**
  - Owner
  - Agent
- **Daily transaction tracking**
  - Cash and bank deposits & withdrawals
  - Expenses
  - Charges
- **Daily reconciliation**
- **Transaction logs**
- **Dashboard views**
- **Modular and scalable architecture**

---

## 🛠️ Tech Stack

- **Frontend:** Next.js (React)  
- **Backend:** API routes in Next.js  
- **Database:** Prisma ORM  
- **Styling:** Tailwind CSS  
- **Deployment:** Vercel / any Next.js supported host

---

## 🧩 Project Structure

```sh

/
├─ app/                     # Pages & application routes
├─ components/              # UI components
├─ lib/                     # Libraries and helpers
├─ prisma/                  # Prisma schema & migrations
├─ public/                  # Public assets
├─ types/                   # TypeScript types
├─ hooks/                   # React hooks
├─ .gitignore
├─ package.json
├─ next.config.ts
├─ tsconfig.json
└─ README.md

````

---

## 🧪 Getting Started

### 🛟 1. Clone the repo

```bash
git clone https://github.com/Ip-Tec/IpBok.git
cd IpBok
````

---

### 🧰 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

---

### 🌍 3. Configure environment

Create a `.env` file from the example and update your settings:

```bash
cp .env.example .env
```

Set your database URL and other environment variables.

---

### 🧠 4. Migrate database

```bash
npx prisma migrate dev
```

---

### 🚧 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view in the browser.

---

## 🚀 Deployment

You can deploy this project easily on **Vercel** (recommended) or any hosting that supports **Next.js**.

---

## 🤝 Contributing

Contributions are welcome!
Feel free to open issues or submit pull requests to improve functionality or add new features.

---

## 📄 License

Project is coming soon...

---

✨ Built with ❤️ by **Ip-Tec** — a simple, reliable base for scalable accounting and transaction tracking.
