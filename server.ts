import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";
import dotenv from "dotenv";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = 3000;

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL || "https://ghdmhoqqawvcnewfilns.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoZG1ob3FxYXd2Y25ld2ZpbG5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMjM4OTYsImV4cCI6MjA4OTc5OTg5Nn0.KrNL3jGnYgyBOrokUu-1qFyqmbcNZ8BHw3c4_1h2dLU";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Health Check & DB Diagnostic
app.get("/api/health", async (req, res) => {
  try {
    const results: any = {
      status: "ok",
      database: "checking...",
      tables: {}
    };

    // Check products table
    const { error: prodError } = await supabase.from("products").select("id").limit(1);
    results.tables.products = prodError ? `Error: ${prodError.message}` : "ok";

    // Check users table
    const { error: userError } = await supabase.from("users").select("id").limit(1);
    results.tables.users = userError ? `Error: ${userError.message}` : "ok";

    if (prodError || userError) {
      results.database = "error";
    } else {
      results.database = "connected";
    }

    res.json(results);
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

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

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("role, email")
      .eq("id", userId)
      .single();

    // Allow if user is admin OR if it's the default admin email
    if (user && (user.role === "admin" || user.email === "premium261256@gmail.com")) {
      return next();
    }

    if (error) {
      console.error("Admin check error:", error.message);
      // If role column is missing, we still want to allow the default admin by email
      // But we need to fetch the user again without the role column to be sure
      const { data: userByEmail } = await supabase
        .from("users")
        .select("email")
        .eq("id", userId)
        .single();
      
      if (userByEmail && userByEmail.email === "premium261256@gmail.com") {
        return next();
      }
    }

    return res.status(403).json({ error: "Forbidden: Admin access required" });
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ error: "Internal server error during auth check" });
  }
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

  if (!email || !password || !name) {
    return res.status(400).json({ error: "Email, password, and name are required" });
  }

  try {
    // Check if user exists
    const { data: existingUsers, error: searchError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email);
    
    if (searchError) {
      console.error("Signup search error:", searchError);
      return res.status(500).json({ error: "Database error: " + searchError.message });
    }

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

    // Try inserting with role first
    const newUser = { 
      id: randomUUID(),
      email, 
      password, 
      name, 
      role: 'user' 
    };

    let { data, error } = await supabase
      .from("users")
      .insert([newUser])
      .select();

    // If role column is missing, try without it
    if (error && (error.message.includes('column "role"') || error.code === '42703' || error.code === 'PGRST204')) {
      console.warn("Role column missing or not in cache, attempting insert without it");
      const { role, ...userWithoutRole } = newUser;
      const retry = await supabase
        .from("users")
        .insert([userWithoutRole])
        .select();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error("Signup insert error FULL:", JSON.stringify(error));
      console.error("Signup insert error MESSAGE:", error.message);
      console.error("Signup insert error CODE:", error.code);
      console.error("Signup insert error DETAILS:", error.details);
      
      return res.status(500).json({ 
        error: "Failed to create account", 
        message: error.message,
        details: error.details,
        code: error.code,
        hint: error.hint
      });
    }

    if (!data || data.length === 0) {
      return res.status(500).json({ error: "Account created but no data returned" });
    }

    const { password: _, ...userWithoutPassword } = data[0];
    res.status(201).json(userWithoutPassword);
  } catch (err) {
    console.error("Signup catch error:", err);
    res.status(500).json({ error: "Internal server error during signup" });
  }
});

// User Auth - Login
app.post("/api/user/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .maybeSingle();
    
    if (error) {
      console.error("Login query error:", error);
      return res.status(500).json({ error: "Login failed: " + error.message });
    }
    
    if (data) {
      const { password: _, ...userWithoutPassword } = data;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ error: "Invalid email or password" });
    }
  } catch (err) {
    console.error("Login catch error:", err);
    res.status(500).json({ error: "Internal server error during login" });
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
