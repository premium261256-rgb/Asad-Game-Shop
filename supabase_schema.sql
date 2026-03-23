-- Supabase Schema for Asad Game Shop

-- Products Table
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  game TEXT NOT NULL,
  name TEXT NOT NULL,
  amount TEXT NOT NULL,
  price NUMERIC NOT NULL,
  image TEXT NOT NULL
);

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Orders Table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userEmail TEXT NOT NULL,
  userName TEXT NOT NULL,
  packageId TEXT NOT NULL,
  packageName TEXT NOT NULL,
  price NUMERIC NOT NULL,
  playerId TEXT NOT NULL,
  paymentMethod TEXT NOT NULL,
  phoneNumber TEXT NOT NULL,
  transactionId TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (Row Level Security) - Optional but recommended
-- For simplicity in this integration, we'll assume the anon key has full access to these tables.
-- In a production environment, you should set up proper policies.
