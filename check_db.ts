import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "https://ghdmhoqqawvcnewfilns.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoZG1ob3FxYXd2Y25ld2ZpbG5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMjM4OTYsImV4cCI6MjA4OTc5OTg5Nn0.KrNL3jGnYgyBOrokUu-1qFyqmbcNZ8BHw3c4_1h2dLU";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log("Checking database...");
  const { data, error } = await supabase.from("users").select("id").limit(1);
  if (error) {
    console.error("Error checking users table:", error);
  } else {
    console.log("Users table exists, data:", data);
  }
}

check();
