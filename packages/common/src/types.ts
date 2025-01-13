import { z } from "zod";
export const CreateUserSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  password: z.string(),
});

export const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const RoomSchema = z.object({
  name: z.string().min(3).max(10),
});
