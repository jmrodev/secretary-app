const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Basic storage (will move file later in controller)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Store in a temporary folder; the controller will move it later.
        const uploadDir = path.join(__dirname, '../uploads/temp');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, 'temp-' + Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.originalname.endsWith('.crt') || file.originalname.endsWith('.key')) {
            cb(null, true);
        } else {
            cb(new Error('Only .crt and .key files are allowed'), false);
        }
    }
});

module.exports = upload;
