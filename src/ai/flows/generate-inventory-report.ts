
'use server';

/**
 * @fileOverview Generates a complete, self-contained HTML page for an inventory report.
 *
 * - generateInventoryReport - A function that generates the report page.
 * - GenerateInventoryReportInput - The input type for the generateInventoryReport function.
 * - GenerateInventoryReportOutput - The return type for the generateInventoryReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { runFlowWithFailover } from '@/ai/flow-runner';

const ProductForReportSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productType: z.string().optional().describe('The type or model of the product.'),
  category: z.string().describe('The category of the product.'),
  condition: z.string().describe('The condition of the product (e.g., "Нов", "Използван").'),
  price: z.number().describe('The realistic optimal selling price of the product.'),
  currency: z.string().describe('The currency for the price (e.g., "BGN").'),
  salesDescription: z.string().optional().describe('The detailed sales description for the product.'),
});

const GenerateInventoryReportInputSchema = z.object({
  products: z.array(ProductForReportSchema).describe('An array of products in the inventory.'),
});
export type GenerateInventoryReportInput = z.infer<typeof GenerateInventoryReportInputSchema>;

const GenerateInventoryReportOutputSchema = z.object({
  htmlContent: z.string().describe('The full, self-contained HTML code for the inventory report webpage.'),
});
export type GenerateInventoryReportOutput = z.infer<typeof GenerateInventoryReportOutputSchema>;

export async function generateInventoryReport(input: GenerateInventoryReportInput): Promise<GenerateInventoryReportOutput> {
  return generateInventoryReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInventoryReportPrompt',
  input: {schema: z.object({ products: z.string().describe('A JSON string of an array of products in the inventory.') })},
  output: {schema: GenerateInventoryReportOutputSchema},
  prompt: `You are an expert web developer specializing in creating beautiful, modern, and responsive single-page data reports. Your task is to generate a complete, self-contained HTML file for an inventory report based on the provided product data. The entire code, including HTML and CSS, must be within this single file. Use a <style> tag for all CSS. You must use the Tailwind CSS library by including it from the official CDN. Do not use external CSS or JS files otherwise.

The page should be visually appealing, clean, and professional, designed for easy reading and data comprehension. It must be fully responsive and look great on both desktop and mobile devices. All text must be in Bulgarian.

**Required Page Structure:**
1.  **Header:** A clean header with the title "Отчет на инвентара" and the date of generation.
2.  **Summary Table:** An overview table at the top summarizing all products. Columns should include: Име на продукта, Категория, Състояние, and Цена.
3.  **Detailed Product Sections:** Below the summary table, create a separate section for each product. Each section should be a styled card containing:
    *   Product Name (as a title)
    *   Product Type
    *   Condition
    *   Price and Currency
    *   the full Sales Description.
4.  **Footer:** A simple footer with a copyright notice for "Пазарен Поглед AI".

The final output must be a single string containing the full HTML code, starting with <!DOCTYPE html>. Ensure all HTML is properly structured and the CSS is well-written and modern.

**Product Data:**
{{{products}}}
`,
});

const generateInventoryReportFlow = ai.defineFlow(
  {
    name: 'generateInventoryReportFlow',
    inputSchema: GenerateInventoryReportInputSchema,
    outputSchema: GenerateInventoryReportOutputSchema,
  },
  async (input) => {
    const promptInput = { products: JSON.stringify(input.products, null, 2) };
    return runFlowWithFailover(prompt, promptInput);
  }
);
