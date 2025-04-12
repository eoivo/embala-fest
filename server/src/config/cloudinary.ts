import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Garantir que as variáveis de ambiente estão carregadas
dotenv.config();

// Configurar Cloudinary usando variáveis de ambiente
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configurar o armazenamento temporário local usando multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Criar pasta temporária se não existir
    const tempDir = path.join(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    // Gerar nome único para o arquivo
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Middleware do Multer para processar uploads
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB
  },
  fileFilter: (req, file, cb) => {
    // Aceitar apenas imagens
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Apenas imagens são permitidas") as any, false);
    }
  },
});

// Função para fazer upload para o Cloudinary
const uploadToCloudinary = async (filePath: string) => {
  try {
    // Usando o método exato conforme a documentação
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      folder: "embalafest/avatars",
      resource_type: "image",
      public_id: `avatar-${Date.now()}`,
      overwrite: true,
      transformation: [
        { width: 500, height: 500, crop: "limit" },
        { fetch_format: "auto", quality: "auto" },
      ],
    });

    // Remover arquivo temporário
    fs.unlinkSync(filePath);

    return uploadResult.secure_url;
  } catch (error) {
    // Remover arquivo temporário mesmo em caso de erro
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

export { cloudinary, upload, uploadToCloudinary };
