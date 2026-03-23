import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = 3000;

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL || "https://ghdmhoqqawvcnewfilns.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoZG1ob3FxYXd2Y25ld2ZpbG5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMjM4OTYsImV4cCI6MjA4OTc5OTg5Nn0.KrNL3jGnYgyBOrokUu-1qFyqmbcNZ8BHw3c4_1h2dLU";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Seed Products from JSON if table is empty
async function seedProducts() {
  try {
    const { count, error: countError } = await supabase.from("products").select("*", { count: 'exact', head: true });
    if (countError) {
      console.error("Error checking products count:", countError.message);
      return;
    }

    if (count === 0) {
      console.log("Seeding products from products.json...");
      const productsData = await fs.readFile(path.join(process.cwd(), "src/data/products.json"), "utf-8");
      const products = JSON.parse(productsData);
      const { error: insertError } = await supabase.from("products").insert(products);
      if (insertError) {
        console.error("Error seeding products:", insertError.message);
      } else {
        console.log("Products seeded successfully.");
      }
    }
  } catch (err) {
    console.error("Seeding failed:", err);
  }
}

seedProducts();

app.use(express.json());

// Admin Role Middleware
const isAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { data: user, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !user || user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  next();
};

// API Routes - Products
app.get("/api/products", async (req, res) => {
  const { data, error } = await supabase.from("products").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/api/products", isAdmin, async (req, res) => {
  const newProduct = { 
    ...req.body, 
    id: req.body.id || `prod-${Date.now()}`
  };
  const { data, error } = await supabase.from("products").insert([newProduct]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

app.put("/api/products/:id", isAdmin, async (req, res) => {
  const { data, error } = await supabase.from("products").update(req.body).eq("id", req.params.id).select();
  if (error) return res.status(500).json({ error: error.message });
  if (data.length === 0) return res.status(404).json({ error: "Product not found" });
  res.json(data[0]);
});

app.delete("/api/products/:id", isAdmin, async (req, res) => {
  const { error } = await supabase.from("products").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

// API Routes - Orders
app.get("/api/orders", isAdmin, async (req, res) => {
  const { data, error } = await supabase.from("orders").select("*").order("timestamp", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get("/api/orders/user/:email", async (req, res) => {
  const { data, error } = await supabase.from("orders").select("*").eq("userEmail", req.params.email).order("timestamp", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/api/orders", async (req, res) => {
  const newOrder = { 
    ...req.body, 
    status: 'pending',
    timestamp: Date.now()
  };
  const { data, error } = await supabase.from("orders").insert([newOrder]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

app.patch("/api/orders/:id", isAdmin, async (req, res) => {
  const { data, error } = await supabase.from("orders").update(req.body).eq("id", req.params.id).select();
  if (error) return res.status(500).json({ error: error.message });
  if (data.length === 0) return res.status(404).json({ error: "Order not found" });
  res.json(data[0]);
});

// Admin Auth Check (Legacy - Now checks role)
app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.from("users").select("*").eq("email", email).eq("password", password).single();
  
  if (data && data.role === 'admin') {
    const { password: _, ...userWithoutPassword } = data;
    res.json({ success: true, user: userWithoutPassword });
  } else {
    res.status(401).json({ error: "Invalid admin credentials" });
  }
});

// User Auth - Signup
app.post("/api/user/signup", async (req, res) => {
  const { email, password, name } = req.body;

  // Check if user exists
  const { data: existingUser } = await supabase.from("users").select("*").eq("email", email).single();
  if (existingUser) {
    return res.status(400).json({ error: "User already exists" });
  }

  const { data, error } = await supabase.from("users").insert([{ email, password, name, role: 'user' }]).select();
  if (error) return res.status(500).json({ error: error.message });

  const { password: _, ...userWithoutPassword } = data[0];
  res.status(201).json(userWithoutPassword);
});

// User Auth - Login
app.post("/api/user/login", async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.from("users").select("*").eq("email", email).eq("password", password).single();
  
  if (data) {
    const { password: _, ...userWithoutPassword } = data;
    res.json(userWithoutPassword);
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
