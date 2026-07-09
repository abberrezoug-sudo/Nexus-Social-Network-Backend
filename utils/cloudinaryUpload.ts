import type { UploadApiResponse } from "cloudinary";
import cloudinary from "../config/cloudinary.js";

const assertCloudinaryConfig = () => {
  const missingKeys = [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ].filter((key) => !process.env[key]);

  if (missingKeys.length > 0) {
    throw new Error(`Missing Cloudinary config: ${missingKeys.join(", ")}`);
  }
};

const toUploadError = (error: unknown) => {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string") {
    return new Error(error);
  }

  if (error && typeof error === "object" && "message" in error) {
    return new Error(String((error as { message: unknown }).message));
  }

  return new Error("Cloudinary upload failed");
};

export const uploadBufferToCloudinary = (
  buffer: Buffer,
  folder: string,
  publicId: string,
) => {
  assertCloudinaryConfig();

  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        overwrite: true,
        resource_type: "image",
      },
      (error, result?: UploadApiResponse) => {
        if (error) {
          reject(toUploadError(error));
          return;
        }

        if (!result?.secure_url) {
          reject(new Error("Cloudinary upload failed"));
          return;
        }

        resolve(result.secure_url);
      },
    );

    uploadStream.end(buffer);
  });
};
