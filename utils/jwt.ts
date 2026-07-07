import jwt from "jsonwebtoken";

const getJwtSecret = (envKey: "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET" | "JWT_SECRET", fallback: string) => {
  const value = process.env[envKey];
  return value && value.trim() ? value : fallback;
};

export const generateAccessToken = (userId: string) => {
  return jwt.sign(
    { id: userId },
    getJwtSecret("JWT_ACCESS_SECRET", "dev-access-secret"),
    {
      expiresIn: "15m",
    }
  );
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign(
    { id: userId },
    getJwtSecret("JWT_REFRESH_SECRET", "dev-refresh-secret"),
    {
      expiresIn: "7d",
    }
  );
};
