import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { randomUUID } from "crypto";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "https://ghdmhoqqawvcnewfilns.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoZG1ob3FxYXd2Y25ld2ZpbG5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMjM4OTYsImV4cCI6MjA4OTc5OTg5Nn0.KrNL3jGnYgyBOrokUu-1qFyqmbcNZ8BHw3c4_1h2dLU";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignup() {
  console.log("Testing signup...");
  const newUser = { 
    id: randomUUID(),
    email: "test@example.com", 
    password: "password123", 
    name: "Test User", 
    role: 'user' 
  };

  let { data, error } = await supabase
    .from("users")
    .insert([newUser])
    .select();

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
    console.error("Signup error:", error);
  } else {
    console.log("Signup success, data:", data);
  }
}

testSignup();
