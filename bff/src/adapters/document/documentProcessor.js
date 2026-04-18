'use strict';

const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../../config');

/**
 * Document processing service.
 * Handles file uploads, metadata extraction, and file management.
 */
const documentProcessor = {
  /**
   * Validate and process an uploaded file.
   * Checks file type and size, generates a unique filename, and returns metadata.
   * @param {Object} file - Multer file object.
   * @returns {Promise<Object>} Processed file metadata.
   */
  async processUpload(file) {
    if (!file) {
      const err = new Error('No file provided');
      err.statusCode = 400;
      throw err;
    }

    // Validate MIME type
    if (!config.document.allowedMimeTypes.includes(file.mimetype)) {
      const err = new Error(
        `File type not allowed: ${file.mimetype}. Allowed: ${config.document.allowedMimeTypes.join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }

    // Validate file size
    if (file.size > config.document.maxFileSize) {
      const err = new Error(
        `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max: ${config.document.maxFileSize / 1024 / 1024}MB`
      );
      err.statusCode = 400;
      throw err;
    }

    // Validate extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!config.document.allowedExtensions.includes(ext)) {
      const err = new Error(
        `File extension not allowed: ${ext}. Allowed: ${config.document.allowedExtensions.join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }

    // Generate unique filename
    const uniqueName = `${uuidv4()}${ext}`;
    const storagePath = path.resolve(config.document.storagePath);
    const filePath = path.join(storagePath, uniqueName);

    return {
      originalName: file.originalname,
      storedName: uniqueName,
      filePath,
      mimeType: file.mimetype,
      size: file.size,
      extension: ext,
      uploadedAt: new Date().toISOString(),
    };
  },

  /**
   * Get metadata for a file at the given path.
   * @param {string} filePath - Absolute path to the file.
   * @returns {Promise<Object>} File metadata.
   */
  async getMetadata(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      return {
        filePath,
        fileName: path.basename(filePath),
        extension: ext,
        size: stats.size,
        createdAt: stats.birthtime.toISOString(),
        modifiedAt: stats.mtime.toISOString(),
      };
    } catch (err) {
      const error = new Error(`File not found: ${filePath}`);
      error.statusCode = 404;
      throw error;
    }
  },

  /**
   * Delete a file at the given path.
   * @param {string} filePath - Absolute path to the file.
   * @returns {Promise<boolean>}
   */
  async deleteFile(filePath) {
    try {
      fs.unlinkSync(filePath);
      return true;
    } catch (err) {
      const error = new Error(`Unable to delete file: ${filePath}`);
      error.statusCode = 404;
      throw error;
    }
  },
};

module.exports = documentProcessor;
