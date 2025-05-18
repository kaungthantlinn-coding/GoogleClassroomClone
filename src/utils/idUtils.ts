/**
 * Utility functions for working with IDs in the application
 */

/**
 * Extracts a numeric ID from a string ID that might have a prefix/suffix
 * Example: "1055-filename.pdf" -> 1055
 * 
 * @param id The ID string to extract from
 * @returns The numeric ID or the original if no numeric ID can be extracted
 */
export const extractNumericId = (id: string | number): string | number => {
  // If it's already a number, return it
  if (typeof id === 'number') return id;
  
  // If it's a string, try to extract a numeric ID
  if (typeof id === 'string') {
    // Extract the first numeric part
    const numericMatch = id.match(/^(\d+)/); // Match digits from start
    
    if (numericMatch && numericMatch[1]) {
      console.log(`Extracted numeric ID ${numericMatch[1]} from ${id}`);
      return numericMatch[1];
    }
  }
  
  // Return the original if no extraction was possible
  return id;
};

/**
 * Extracts a file ID from a compound ID string like "submissionId-filename"
 * This is often used in file IDs where the real ID is before the hyphen
 * 
 * @param fileId The compound file ID (e.g., "1055-report.pdf")
 * @returns The extracted file ID
 */
export const extractFileId = (fileId: string | number): string | number => {
  // If it's already a number, return it
  if (typeof fileId === 'number') return fileId;
  
  // If it's a string, try to extract the part before the first hyphen
  if (typeof fileId === 'string' && fileId.includes('-')) {
    const parts = fileId.split('-');
    if (parts.length > 0 && parts[0]) {
      console.log(`Extracted file ID ${parts[0]} from ${fileId}`);
      return parts[0];
    }
  }
  
  // Return the original if no extraction was possible
  return fileId;
};
