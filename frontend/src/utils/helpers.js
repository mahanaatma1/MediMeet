/**
 * Format a date to a readable string
 * @param {string|Date} dateString - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return dateString; // Return the original string if it's not a valid date
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString; // Return the original string in case of any error
  }
};

/**
 * Add leading zeros to a number
 * @param {number} num - The number to pad
 * @param {number} size - The desired size of the resulting string
 * @returns {string} Padded number as string
 */
export const padZero = (num, size = 2) => {
  let s = String(num);
  while (s.length < size) s = "0" + s;
  return s;
};

/**
 * Format a date for display in short format (e.g., Jan 12, 2023)
 * @param {string|Date} dateString - The date to format
 * @returns {string} Formatted date string
 */
export const formatShortDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting short date:', error);
    return dateString;
  }
};

/**
 * Format a date and time for display
 * @param {string|Date} dateString - The date to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date time:', error);
    return dateString;
  }
}; 