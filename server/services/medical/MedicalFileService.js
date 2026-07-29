const { logAction } = require('../../utils/system/audit');
const fs = require('fs');
const path = require('path');
const medicalFileRepository = require('../../repositories/medical/medicalFileRepository');
const systemSettingsRepository = require('../../repositories/system/systemSettingsRepository');

/**
 * MedicalFileService
 * Handles business logic for patient file management.
 */
class MedicalFileService {
    /**
     * Upload a file
     */
    async uploadFile(req, fileData) {
        const { patientId, description } = fileData.body;
        const { filename, originalname, mimetype } = fileData.file;
        const uploaded_by = req.user.user_id;
        const file_url = `/uploads/${filename}`;
        const file_name = originalname;
        const file_type = mimetype;

        await medicalFileRepository.create({
            patient_id: patientId, uploaded_by, file_name, file_url, file_type, description
        });

        logAction(req, 'UPLOAD_FILE', `File: ${file_name} for Patient ID: ${patientId}`);
    }

    /**
     * Get files for a patient
     */
    async getPatientFiles(filters) {
        return await medicalFileRepository.findAll(filters);
    }

    /**
     * Delete a file
     */
    async deleteFile(req, id) {
        const { role } = req.user;

        if (role !== 'admin') {
            if (role === 'secretary') {
                const setting = await systemSettingsRepository.findByKey('enable_secretary_crud_files');
                if (!setting || setting.setting_value !== 'true') throw new Error("Unauthorized");
            } else {
                throw new Error("Unauthorized");
            }
        }

        const file = await medicalFileRepository.findById(id);
        if (!file) throw new Error("File not found");

        const filePath = path.join(__dirname, '../../../', file.file_url);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await medicalFileRepository.delete(id);
        logAction(req, 'DELETE_FILE', `Deleted File ID: ${id}`);
    }
}

module.exports = new MedicalFileService();
