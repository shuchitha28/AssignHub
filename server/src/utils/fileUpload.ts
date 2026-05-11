import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary if credentials exist
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export const saveBase64File = async (base64String: string, folder: string = "uploads"): Promise<string | null> => {
  try {
    if (!base64String) return null;
    
    // If it's already a URL or not base64, return as is
    if (!base64String.includes(";base64,")) return base64String;

    // OPTION 1: CLOUDINARY (If configured)
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      const [meta] = base64String.split(";base64,");
      const isPdf = meta.includes("application/pdf");
      
      let uploadPayload = base64String;
      let uploadOptions: any = {
        folder: `assignhub/${folder}`,
        resource_type: "auto",
      };

      if (isPdf) {
        const base64Data = base64String.split(";base64,")[1];
        uploadPayload = `data:text/plain;base64,${base64Data}`;
        uploadOptions.resource_type = "raw";
        uploadOptions.public_id = `${uuidv4()}.txt`; 
        uploadOptions.folder = `assignhub/pdfs`; 
      }

      const uploadResponse = await cloudinary.uploader.upload(uploadPayload, uploadOptions);
      return uploadResponse.secure_url;
    }

    // OPTION 2: LOCAL STORAGE (Fallback)
    const [meta, data] = base64String.split(";base64,");
    const extension = meta.split("/")[1].split(";")[0];
    const fileName = `${uuidv4()}.${extension}`;
    const uploadsDir = path.join(process.cwd(), folder);
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, data, { encoding: "base64" });

    return `/${folder}/${fileName}`;
  } catch (error: any) {
    console.error("❌ FILE UPLOAD ERROR DETAILS:", error.message || error);
    return null;
  }
};

/**
 * Deletes a file from Cloudinary or Local Storage
 * @param fileUrl The full URL or relative path of the file
 */
export const deleteFile = async (fileUrl: string | undefined): Promise<boolean> => {
  try {
    if (!fileUrl) return true;

    // OPTION 1: CLOUDINARY
    if (fileUrl.includes("cloudinary.com")) {
      // Extract public_id from URL: .../upload/v123/folder/public_id.ext
      // Example: https://res.cloudinary.com/cloud/image/upload/v1/assignhub/profiles/xyz123.jpg
      const parts = fileUrl.split("/");
      const uploadIndex = parts.indexOf("upload");
      if (uploadIndex === -1) return false;

      // Everything after 'upload/' or 'v[timestamp]/' and before the extension
      let publicIdWithExt = parts.slice(uploadIndex + 1).join("/");
      
      // If there is a version number (v12345), skip it
      if (publicIdWithExt.startsWith("v")) {
        publicIdWithExt = parts.slice(uploadIndex + 2).join("/");
      }

      // Remove extension
      const publicId = publicIdWithExt.split(".")[0];
      
      await cloudinary.uploader.destroy(publicId);
      return true;
    }

    // OPTION 2: LOCAL STORAGE
    if (fileUrl.startsWith("/")) {
      const filePath = path.join(process.cwd(), fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return true;
    }

    return true;
  } catch (error: any) {
    console.error("❌ FILE DELETION ERROR:", error.message || error);
    return false;
  }
};

