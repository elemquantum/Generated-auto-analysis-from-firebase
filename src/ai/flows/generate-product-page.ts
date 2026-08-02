
'use server';

/**
 * @fileOverview Generates a complete, self-contained HTML page for a product.
 *
 * - generateProductPage - A function that generates the product page.
 * - GenerateProductPageInput - The input type for the generateProductPage function.
 * - GenerateProductPageOutput - The return type for the generateProductPage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { runFlowWithFailover } from '@/ai/flow-runner';

const GenerateProductPageInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productType: z.string().optional().describe('The type or model of the product.'),
  category: z.string().describe('The category of the product, used for finding relevant images.'),
  condition: z.string().describe('The condition of the product (e.g., "Нов", "Използван").'),
  conditionJustification: z.string().describe('The justification for the assessed condition.'),
  price: z.number().describe('The realistic selling price of the product.'),
  currency: z.string().describe('The currency for the price (e.g., "BGN").'),
  salesDescription: z.string().describe('The detailed sales description for the product.'),
});
export type GenerateProductPageInput = z.infer<typeof GenerateProductPageInputSchema>;

const GenerateProductPageOutputSchema = z.object({
  htmlContent: z.string().describe('The full, self-contained HTML code for the product webpage.'),
});
export type GenerateProductPageOutput = z.infer<typeof GenerateProductPageOutputSchema>;

export async function generateProductPage(input: GenerateProductPageInput): Promise<GenerateProductPageOutput> {
  return generateProductPageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProductPagePrompt',
  input: {schema: GenerateProductPageInputSchema},
  output: {schema: GenerateProductPageOutputSchema},
  prompt: `You are an expert web developer and visual designer, specializing in creating "super viral", modern, and responsive single-page product presentations. Your task is to generate a complete, self-contained HTML file for a product. The design must be stunning, using 3D animations with CSS, and a scientific data visualization aesthetic.

The page must be fully self-contained. All CSS and JavaScript must be inside the HTML file in <style> and <script> tags. Use a modern font from Google Fonts.

**Design Requirements:**
1.  **Viral & 3D Design:** Create a visually striking layout. Use CSS 3D transforms and animations to make elements feel like they are floating or have depth. The background should be a dynamic gradient or subtle pattern.
2.  **Scientific Data Visualization Plotter Aesthetic:** Present information cleanly and professionally. Use clear typography, good spacing, and a layout that resembles a high-tech dashboard or scientific plotter.
3.  **Responsive:** The page must look perfect on both desktop and mobile devices.
4.  **Images:** You MUST include at least 3 high-quality, relevant images for the product. Use placeholder images from a free online service like Unsplash Source (\`https://source.unsplash.com/800x600/?<keyword>\`). Use the product category and name as keywords. For example: \`https://source.unsplash.com/800x600/?{{{category}}},product\`
5.  **Contact Info:** The contact email must be exactly 'earthwellnes@gmail.com'.
6.  **Download to PDF:** The page must include a "Download as PDF" button. The button must use JavaScript (\`window.print()\`) to open the browser's print dialog, allowing the user to save the page as a PDF. Style the page for printing by hiding the download button in the print view (@media print).

**Product Information:**
- Product Name: {{{productName}}}
- Product Type: {{{productType}}}
- Category for images: {{{category}}}
- Condition: {{{condition}}}
- Justification for Condition: {{{conditionJustification}}}
- Price: {{{price}}} {{{currency}}}
- Sales Description:
{{{salesDescription}}}

**Required Page Structure:**
1.  **Header:** A sleek header with the product name.
2.  **Hero Section:** A main section with a 3D-animated product image placeholder and the product name, condition, and price clearly visible.
3.  **Image Gallery:** A section with at least two more placeholder images, perhaps in a creative layout.
4lag. **Details & Description Section:** A clean, data-visualization style layout for the key details (condition justification, product type) and the full sales description.
5.  **Contact Section:** A dedicated section with the contact email 'earthwellnes@gmail.com' and the "Download as PDF" button.
6.  **Footer:** A simple footer.

The final output must be a single string containing the full HTML code.
`,
});

const generateProductPageFlow = ai.defineFlow(
  {
    name: 'generateProductPageFlow',
    inputSchema: GenerateProductPageInputSchema,
    outputSchema: GenerateProductPageOutputSchema,
  },
  async (input) => {
    return runFlowWithFailover(prompt, input);
  }
);
