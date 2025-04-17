
/**
 * JSX to TSX Converter Module
 * This module handles the conversion of JSX code to TypeScript TSX
 */
import { convertJSXToTSX } from './converter';

export class JSXConverter {
  /**
   * Converts JSX code to TypeScript TSX
   * @param jsxCode - The JSX code to convert
   * @returns The converted TSX code
   */
  static async convertJSXtoTSX(jsxCode: string): Promise<string> {
    try {
      // Use the advanced converter implementation
      const result = convertJSXToTSX(jsxCode);
      console.log("Conversion successful");
      return result;
    } catch (error) {
      console.error("Error in JSX to TSX conversion:", error);
      throw new Error(`Failed to convert JSX to TSX: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
