import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = 'AIzaSyDYg4-7EQzMO79_eY9ZK9yuUd2fqietN_A';
const genAI = new GoogleGenerativeAI(apiKey);

export const generateProductDescription = async (name: string, brand: string, unit: string) => {
    try {
        // Use gemini-1.5-flash as it's safe if 2.5/2.0 aren't out yet, but but if user specifies 2.5 I'll use it.
        // For now, I'll use 1.5-flash which is widely available and fast.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
        
        const fullProductName = `${brand} ${name} ${unit}`.trim();
        const prompt = `You are an expert E-commerce Copywriter for a fast-delivery platform like Blinkit. Provide a catchy and informative description for the product: **${fullProductName}**.

Focus on:
1. Product Overview – what is it and why it's great.
2. Key Benefits & Features – freshness, quality, taste, or unique selling points.
3. Common Use Cases – how/when to use it (e.g., breakfast, snack, party, household chore).
4. Shelf Life/Storage – if relevant.

Important Instructions:
- Write in a modern, snappy, and customer-centric tone.
- Use a mix of short paragraphs and bullet points for better readability.
- Keep the overall length around 100-150 words.
- Make it sound premium and essential.
- Avoid generic marketing jargon; be specific to the product.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("AI Generation Error:", error);
        throw error;
    }
};
