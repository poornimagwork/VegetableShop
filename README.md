# GreenBasket

A vegetable shop for Bengaluru market prices. Customers browse the catalogue, register, and place cash-on-delivery orders. The shop admin manages vegetables, stock, and order status.

The React shop stays in this folder. The API lives in `server/` and stores data in the local PostgreSQL database `online_veggies`.

## Run it locally

Use two terminals.

```powershell
# Terminal 1 — API
cd server
npm install
npm run migrate
npm run seed
npm run dev
```

```powershell
# Terminal 2 — shop
npm install
npm run dev
```

Open http://localhost:5173

Copy `server/.env.example` to `server/.env` and set your PostgreSQL password there. The API reads that file only. The browser never sees the database password.

## Demo accounts

After `npm run seed`:

- Admin: `admin@greenbasket.local` / `Admin@1234`
- Customers: register from the shop

Admin can add, edit, hide, and show vegetables, and can move orders from pending to confirmed, delivered, or cancelled. Cancelling an order puts the stock back.

## What is stored

- `users` — customer and admin accounts, with hashed passwords
- `vegetables` — name, Bangalore price, unit, photo, and stock
- `orders` and `order_items` — each order keeps the price and name from the moment it was placed
