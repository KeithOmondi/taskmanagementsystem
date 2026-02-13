import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

const CloudinaryStorage = require("multer-storage-cloudinary"); // <-- do NOT destructure

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req: any, file: any) => ({
    folder: "task-attachments",
    resource_type: "auto",
    type: "authenticated",
    allowed_formats: ["jpg", "png", "pdf", "docx", "xlsx"],
    public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
  }),
});

export const upload = multer({
  storage: storage as unknown as multer.StorageEngine,
});
