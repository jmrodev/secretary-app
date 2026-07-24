const profileService = require('../../services/user/profileService');

exports.getProfile = async (req, res) => {
    try {
        const profile = await profileService.getProfile(req.user);
        if (profile) res.json(profile);
        else res.status(404).send("Profile not found");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.updateProfile = async (req, res) => {
    try {
        await profileService.updateProfile(req.user, req.body);
        res.send("Profile updated successfully");
    } catch (err) {
        if (err.message === "Profile not found") return res.status(404).send(err.message);
        console.error("Update Profile Error:", err);
        res.status(500).json({ error: "Server Error" });
    }
};
