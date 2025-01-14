const { z } = require("zod");
const CreateUserSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  password: z.string(),
});

const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const RoomSchema = z.object({
  name: z.string().min(3).max(10),
});

module.exports = {
  CreateUserSchema,
  SignInSchema,
  RoomSchema,
};
