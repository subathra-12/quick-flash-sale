import bcrypt from "bcryptjs";
import { AppDataSource } from "../config/ormconfig";
import { User } from "../entity/User";
import { generateTokens } from "../utils/jwt";

const userRepo = AppDataSource.getRepository(User);

export const registerUser = async (name: string, email: string, password: string) => {
  const existing = await userRepo.findOne({ where: { email } });
  if (existing) throw new Error("User already exists");

  const hashed = await bcrypt.hash(password, 10);
  const user = userRepo.create({ name, email, password: hashed });
  await userRepo.save(user);
  return user;
};

export const loginUser = async (email: string, password: string) => {
  const user = await userRepo.findOne({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error("Invalid credentials");
  }

  const tokens = generateTokens({ id: user.id, email: user.email });
  return { user, ...tokens };
};
