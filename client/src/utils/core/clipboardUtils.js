/**
 * Copies text to the clipboard, handling both secure and non-secure contexts.
 * Falls back to document.execCommand('copy') if navigator.clipboard is unavailable.
 * 
 * @param {string} text - The text to copy
 * @returns {Promise<boolean>} - Resolves to true if successful, rejects if failed
 */
export const copyToClipboard = async (text) => {
    // Try the modern Clipboard API first (only works in secure contexts: HTTPS or localhost)
    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.warn("Clipboard API available but failed, trying fallback...", err);
        }
    }

    // Fallback for non-secure contexts (HTTP) or older browsers
    return new Promise((resolve, reject) => {
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;

            // Ensure it's not visible but part of DOM
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            textArea.setAttribute('readonly', ''); // Prevent keyboard popping up on mobile
            document.body.appendChild(textArea);

            textArea.focus();
            textArea.select();

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            if (successful) {
                resolve(true);
            } else {
                reject(new Error("Fallback copy failed: execCommand returned false"));
            }
        } catch (err) {
            reject(err);
        }
    });
};
