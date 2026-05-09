/**
 * Import events from Google Calendar to local database
 * [DISABLED] Currently using one-way sync from Secretary App to Google.
 */
async function importFromGoogle() {
    console.log("[GoogleImport] One-way Sync Enabled directly: SKIPPING IMPORT from Google.");
}

module.exports = { importFromGoogle };
