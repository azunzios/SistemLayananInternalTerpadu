/**
 * Utility function for copying text to clipboard with fallback support
 * Handles browsers that block the Clipboard API
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    // Try using the modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback to legacy execCommand method
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // Make the textarea invisible and positioned off-screen
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        return successful;
      } finally {
        textArea.remove();
      }
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};
