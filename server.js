import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json());
app.use(cors());

// Vars de ambiente
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON
);

// Registrar
app.post("/register", async (req, res) => {
  const { nick, password } = req.body;

  const { data, error } = await supabase
    .from("users")
    .insert([{ nick, password }]);

  if (error) return res.status(400).json({ error });
  return res.json({ message: "Conta criada!" });
});

// Login
app.post("/login", async (req, res) => {
  const { nick, password } = req.body;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("nick", nick)
    .eq("password", password)
    .maybeSingle();

  if (error || !data) return res.status(400).json({ error: "Credenciais inválidas" });
  return res.json({ message: "Logado!", user: data });
});

// Porta Render
const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server ON"));