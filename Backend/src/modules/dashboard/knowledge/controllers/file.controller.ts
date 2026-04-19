import { Request, Response } from 'express';
import { AuthRequest } from "@shared/middlewares/auth.js";
import { KnowledgeDocument } from "@modules/dashboard/knowledge/models/KnowledgeDocument.js";
import { Brain } from "@modules/dashboard/brain/models/Brain.js";
import { embedQueue } from "../../../../jobs/queues.js";
import { usageService } from "../../../../services/usage.service.js";
import { ActivityType } from "../../../../models/ActivityLog.js";

// 📤 Upload Document
export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;
    const { orgId } = req.user!;
    const { title, description, intent_summary, tags, skipTrain } = req.body;

    const parsedTags = tags ? JSON.parse(tags) : [];
    const isDraft = skipTrain === 'true' || skipTrain === true;

    await usageService.checkFreshLimit(orgId, 'max_files');
    await usageService.checkFreshLimit(orgId, 'max_training_tokens');

    if (!file) return res.status(400).json({ success: false, message: "No file uploaded" });

    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');

    const { uploadFile } = await import("@modules/shared/services/storage.service.js");
    const minioUrl = await uploadFile(file);

    const newDoc = await KnowledgeDocument.create({
      orgId,
      name: title || file.originalname,
      url: minioUrl,
      file_path: minioUrl,
      file_type: file.mimetype,
      size: file.size,
      status: isDraft ? 'draft' : 'processing',
      tags: parsedTags,
      summary: description,
      intent_summary,
      uploadedAt: new Date(),
      metadata: { source: 'minio-upload', bucket: 'cluaiz-storage' }
    });

    const { updateStorageBreakdown, updateSystemStorage } = await import("../storage.helper.js");
    const fileSizeMB = file.size / (1024 * 1024);
    await updateStorageBreakdown(orgId, 'documents', fileSizeMB, 'add');
    await updateSystemStorage(orgId, 'minio', fileSizeMB, 'add');

    if (!isDraft) {
      await embedQueue.add("process-document", {
        orgId, filePath: minioUrl, fileName: file.originalname,
        fileType: file.mimetype, siteId: null,
        metadata: { fileId: newDoc._id.toString(), type: 'file', storage: 'minio' }
      }, { removeOnComplete: true });
      newDoc.status = 'processing';
      await newDoc.save();
    }

    res.json({ success: true, message: 'File processing started', data: newDoc });
  } catch (error: any) {
    console.error('Error in uploadDocument:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

// ⬇️ Download File
export const downloadFile = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { orgId } = req.user!;
    const doc = await KnowledgeDocument.findOne({ _id: id, orgId });
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
    if (!doc.url) return res.status(400).json({ success: false, message: "Document has no URL" });

    const axios = (await import("axios")).default;
    const response = await axios({ url: doc.url, method: 'GET', responseType: 'stream' });
    res.setHeader('Content-Disposition', `attachment; filename="${doc.name}"`);
    res.setHeader('Content-Type', doc.file_type || 'application/octet-stream');
    response.data.pipe(res);
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Download failed" });
  }
};
