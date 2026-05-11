const systemSettingsService = require('../../services/system/systemSettingsService');

exports.getSettings = async (req, res) => {
    try {
        const settings = await systemSettingsService.getPublicSettings();
        res.json(settings);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.updateSetting = async (req, res) => {
    try {
        const { key, value } = req.body;
        await systemSettingsService.updateSetting(key, value);
        res.json({ message: "Setting updated" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.refreshTunnel = (req, res) => {
    try {
        systemSettingsService.refreshTunnel();
        res.json({ message: "Refresh initiated. It may take a minute to update the URL." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to refresh remote access" });
    }
};
