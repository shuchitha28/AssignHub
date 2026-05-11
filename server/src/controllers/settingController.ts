import Setting from "../models/setting";
import { saveBase64File, deleteFile } from "../utils/fileUpload";


// GET SETTINGS
export const getSettings = async (req: any, res: any) => {
  let settings = await Setting.findOne();

  if (!settings) {
    settings = await Setting.create({});
  }

  res.json(settings);
};

// UPDATE SETTINGS
export const updateSettings = async (req: any, res: any) => {
  try {
    const data = { ...req.body };

    // Handle branding logo
    if (data.branding?.logo && data.branding.logo.startsWith("data:")) {
      const oldSettings = await Setting.findOne();
      if (oldSettings?.branding?.logo) {
        await deleteFile(oldSettings.branding.logo);
      }
      data.branding.logo = await saveBase64File(data.branding.logo);
    }


    const settings = await Setting.findOneAndUpdate(
      {},
      { $set: data },
      { upsert: true, runValidators: true, returnDocument: 'after' }
    );


    res.json(settings);
  } catch (err) {
    console.error("UPDATE SETTINGS ERROR:", err);
    res.status(500).json({ message: "Update failed" });
  }
};