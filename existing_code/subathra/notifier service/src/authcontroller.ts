import { Request, Response } from "express";
import { registerUser, loginUser } from "../services/auth.service";
import { verifyRefreshToken, generateTokens } from "../utils/jwt";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const user = await registerUser(name, email, password);
    res.json({ message: "User registered successfully", user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const data = await loginUser(email, password);
    res.json(data);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

export const refreshToken = (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const user = verifyRefreshToken(refreshToken) as any;
    const tokens = generateTokens({ id: user.id, email: user.email });
    res.json(tokens);
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
};

export const logout = (req: Request, res: Response) => {
  // Optional: blacklist refresh token
  res.json({ message: "Logged out successfully" });
};
