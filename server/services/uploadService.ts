import Busboy from 'busboy';
import type { Request } from 'express';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { validateImageFile } from '../validators/index';

interface ParsedImageFile {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export function parseMultipartImage(req: Request): Promise<ParsedImageFile> {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      reject(new AppError('Expected multipart/form-data upload.', 400));
      return;
    }

    const busboy = Busboy({
      headers: req.headers,
      limits: {
        files: 1,
        fileSize: MAX_FILE_SIZE_BYTES + 1024,
      },
    });

    let foundFile = false;
    let fileTooLarge = false;
    let fileMimeType = '';
    let filename = 'upload.jpg';
    const chunks: Buffer[] = [];

    busboy.on('file', (_fieldname, file, info) => {
      foundFile = true;
      fileMimeType = info.mimeType || 'application/octet-stream';
      filename = info.filename || 'upload.jpg';

      file.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      file.on('limit', () => {
        fileTooLarge = true;
      });
    });

    busboy.on('error', (err) => {
      reject(new AppError(`Failed to parse upload: ${String(err)}`, 400));
    });

    busboy.on('finish', () => {
      if (!foundFile) {
        reject(new AppError('No image file provided.', 400));
        return;
      }
      if (fileTooLarge) {
        reject(new AppError('Image file must be 5 MB or smaller.', 400));
        return;
      }

      const buffer = Buffer.concat(chunks);
      const validation = validateImageFile(fileMimeType, buffer.length);
      if (!validation.valid) {
        reject(new AppError(validation.error || 'Invalid image file.', 400));
        return;
      }

      resolve({ buffer, mimeType: fileMimeType, filename });
    });

    req.pipe(busboy);
  });
}

export async function uploadImageToImgBB(file: ParsedImageFile): Promise<string> {
  const base64Image = file.buffer.toString('base64');

  if (env.imgbbApiKey && env.imgbbApiKey !== 'your_imgbb_api_key') {
    const formBody = new URLSearchParams();
    formBody.append('key', env.imgbbApiKey);
    formBody.append('image', base64Image);
    formBody.append('name', file.filename);

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new AppError(
        `ImgBB upload failed (${response.status}): ${errorText || 'Remote error'}`,
        502
      );
    }

    const payload = (await response.json()) as {
      success?: boolean;
      data?: { display_url?: string; url?: string };
      error?: { message?: string };
    };

    if (!payload.success || !(payload.data?.display_url || payload.data?.url)) {
      throw new AppError(
        payload.error?.message || 'ImgBB returned an invalid response.',
        502
      );
    }

    return payload.data.display_url || payload.data.url || '';
  }

  // When IMGBB_API_KEY is not configured in the local/preview environment,
  // return a validated inline data URL so end-to-end uploads work without local file storage.
  return `data:${file.mimeType};base64,${base64Image}`;
}
