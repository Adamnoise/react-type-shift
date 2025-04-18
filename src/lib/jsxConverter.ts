/**
 * JSX to TSX Converter Module
 * This module handles the conversion of JSX code to TypeScript TSX
 */
import { convertJSXToTSX } from './converter';
import { ConversionConfig, ConversionErrorDetails } from './types';
import { generateErrorDetails } from './utils/errorReporter';
import * as JSZip from 'jszip';
import { saveAs } from 'file-saver';

export class JSXConverter {
  /**
   * Converts a single JSX code to TypeScript TSX
   * @param jsxCode - The JSX code to convert
   * @param config - Optional conversion configuration
   * @returns The converted TSX code and any error details
   */
  static async convertJSXtoTSX(
    jsxCode: string, 
    config: ConversionConfig = { conversionLevel: 'standard' }
  ): Promise<{ code: string; errors: ConversionErrorDetails[] }> {
    try {
      // Use the advanced converter implementation with configuration
      const result = convertJSXToTSX(jsxCode, config);
      console.log("Conversion successful");
      return { code: result, errors: [] };
    } catch (error) {
      console.error("Error in JSX to TSX conversion:", error);
      const errorDetails = generateErrorDetails(error, jsxCode);
      return {
        code: '',
        errors: [errorDetails]
      };
    }
  }

  /**
   * Batch convert multiple JSX files to TSX
   * @param files - Array of files with name and content
   * @param config - Optional conversion configuration
   * @returns Object with converted files and errors
   */
  static async batchConvert(
    files: { name: string; content: string }[],
    config: ConversionConfig = { conversionLevel: 'standard' }
  ): Promise<{
    convertedFiles: { name: string; content: string }[];
    errors: { fileName: string; errors: ConversionErrorDetails[] }[];
  }> {
    const convertedFiles: { name: string; content: string }[] = [];
    const errors: { fileName: string; errors: ConversionErrorDetails[] }[] = [];

    for (const file of files) {
      try {
        const { code, errors: conversionErrors } = await this.convertJSXtoTSX(file.content, config);
        
        // Replace .jsx extension with .tsx
        const newFileName = file.name.replace(/\.jsx$/, '.tsx');
        
        if (conversionErrors.length > 0) {
          errors.push({ fileName: file.name, errors: conversionErrors });
        }

        if (code) {
          convertedFiles.push({ 
            name: newFileName, 
            content: code 
          });
        }
      } catch (error) {
        console.error(`Error converting file ${file.name}:`, error);
        errors.push({
          fileName: file.name,
          errors: [{
            message: `Failed to convert: ${error instanceof Error ? error.message : 'Unknown error'}`,
            line: 0,
            column: 0,
            severity: 'error',
            code: 'CONVERSION_FAILED'
          }]
        });
      }
    }

    return { convertedFiles, errors };
  }

  /**
   * Export multiple converted files as a zip archive
   * @param files - Array of converted files with name and content
   * @returns Promise resolving to the generated zip blob
   */
  static async exportAsZip(files: { name: string; content: string }[]): Promise<void> {
    try {
      const zip = new JSZip();
      
      files.forEach(file => {
        zip.file(file.name, file.content);
      });
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'converted-tsx-files.zip');
      
      console.log("Zip export successful");
    } catch (error) {
      console.error("Error creating zip export:", error);
      throw new Error(`Failed to create zip export: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
