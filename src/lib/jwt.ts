// src/lib/jwt.ts
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export function signJwt(payload: object, options?: jwt.SignOptions) {
  if (!JWT_SECRET) throw new Error("JWT_SECRET not set");
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d", ...options });
}

export function verifyJwt(token: string) {
  if (!JWT_SECRET) throw new Error("JWT_SECRET not set");
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}