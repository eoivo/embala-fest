import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import { AuthRequest } from "../middleware/auth.js";
import mongoose from "mongoose";
import { uploadToCloudinary } from "../config/cloudinary.js";

const generateToken = (id: mongoose.Types.ObjectId | string) => {
  return jwt.sign({ id: id.toString() }, process.env.JWT_SECRET!, {
    expiresIn: "30d",
  });
};

export const registerUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, phone, email, password, role } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error("User already exists");
    }

    const user = await User.create({
      name,
      phone,
      email,
      password,
      role,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error("Invalid user data");
    }
  }
);

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

export const getUsers = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const users = await User.find({}).select("-password");
    res.json(users);
  }
);

export const updateUser = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.params.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone || user.phone;
      user.email = req.body.email || user.email;
      user.role = req.body.role || user.role;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        role: updatedUser.role,
      });
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  }
);

export const updatePassword = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user.id); // Usuário autenticado

    if (!user) {
      res.status(404);
      throw new Error("Usuário não encontrado");
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      res.status(400);
      throw new Error("A senha antiga e a nova senha são obrigatórias");
    }

    // Verifica se a senha antiga está correta
    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      res.status(401);
      throw new Error("Senha antiga incorreta");
    }

    // Atualiza a senha e salva
    user.password = newPassword;
    await user.save();

    res.json({ message: "Senha atualizada com sucesso" });
  }
);

export const getCurrentUser = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user?._id).select("-password");

    if (user) {
      res.json(user);
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  }
);

export const getUserById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.params.id).select("-password");

    if (user) {
      res.json(user);
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  }
);

export const deleteUser = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error("Usuário não encontrado");
    }

    // Verifica se o usuário logado tem permissão de admin
    if (req.user.role !== "admin") {
      res.status(403);
      throw new Error(
        "Não autorizado. Apenas administradores podem excluir usuários"
      );
    }

    // Verifica se o usuário está tentando excluir a si mesmo
    if (user._id.toString() === req.user.id) {
      res.status(400);
      throw new Error("Não é possível excluir sua própria conta");
    }

    await User.deleteOne({ _id: user._id });

    res.json({ message: "Usuário excluído com sucesso" });
  }
);

// Adicione esta função no userController.js
export const authenticateManager = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      res.status(401);
      throw new Error("Email ou senha inválidos");
    }

    // Verificar se o usuário é um gerente ou administrador
    if (user.role !== "manager" && user.role !== "admin") {
      res.status(403);
      throw new Error(
        "Acesso negado. Somente gerentes podem realizar esta ação."
      );
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      res.status(401);
      throw new Error("Email ou senha inválidos");
    }

    // Se chegou até aqui, a autenticação foi bem-sucedida
    res.json({
      success: true,
      userId: user._id,
      name: user.name,
      role: user.role,
      token: generateToken(user._id),
    });
  }
);

export const updateOwnProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error("Usuário não encontrado");
    }

    // Permitir atualização apenas de campos específicos
    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    user.email = req.body.email || user.email;

    // Não permitir que o usuário altere seu próprio papel/cargo
    // Role deve permanecer o mesmo

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      phone: updatedUser.phone,
      email: updatedUser.email,
      role: updatedUser.role,
    });
  }
);

export const updateAvatar = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    try {
      // Verificar se temos o arquivo (já verificado no middleware anterior, mas por segurança)
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "Nenhum arquivo foi enviado",
        });
        return;
      }

      // Verificar usuário
      const user = await User.findById(req.user._id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
        return;
      }

      // Upload do arquivo para o Cloudinary
      let imageUrl;
      try {
        imageUrl = await uploadToCloudinary(req.file.path);
      } catch (uploadError: any) {
        res.status(500).json({
          success: false,
          message: "Erro ao enviar imagem para o serviço de armazenamento",
          error: uploadError.message,
        });
        return;
      }

      if (!imageUrl) {
        res.status(500).json({
          success: false,
          message: "Falha ao processar imagem - nenhuma URL retornada",
        });
        return;
      }

      // Atualizar o campo avatar do usuário
      user.avatar = imageUrl;
      await user.save();

      // Resposta de sucesso
      res.status(200).json({
        success: true,
        avatar: imageUrl,
        message: "Avatar atualizado com sucesso",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Erro interno ao processar avatar",
      });
    }
  }
);
