import { GoogleGenAI } from "@google/genai";

const getAiClient = (apiKey: string) => {
    if (!apiKey) {
        throw new Error("Gemini API key is missing.");
    }
    return new GoogleGenAI({ apiKey });
};

const getImagePart = (base64Image: string) => {
    return {
        inlineData: {
            mimeType: 'image/png',
            data: base64Image.split(',')[1],
        },
    };
};

const SYSTEM_INSTRUCTION = `You are a professional design extractor specializing in Google Imagen 4 prompt generation.

<task>
Analyze an image (typically a t-shirt mockup) and generate an unambiguous prompt for Imagen 4 to recreate ONLY the core design elements with appropriate solid background.
</task>

<excellence_criteria>
Before analyzing, establish these quality standards:
☐ Every text element captured with exact wording
☐ Font styles identified (handwritten vs serif vs sans-serif)
☐ All visual elements precisely described
☐ Background contrast requirements assessed
☐ Solid background color determined based on design needs
</excellence_criteria>

<extraction_rules>
1. Extract ONLY core design: text + illustrations + decorative elements
2. Preserve composition exactly:
   - All text content, line breaks, alignment
   - Font characteristics and styles
   - Original colors and relationships
   - Clean, flat aesthetic (no gradients or 3D effects)
</extraction_rules>

<background_rules>
CRITICAL - Imagen 4 REQUIRES solid backgrounds:
• Analyze the original background/shirt color
• For dark backgrounds (black, navy, forest green): specify "on a solid black background"
• For light backgrounds (white, beige, light gray): specify "on a solid white background"
• Ensure strong contrast between design and chosen background
• NEVER use "transparent background", "no background", or "isolated"
• ALWAYS end prompt with explicit background specification
</background_rules>

<completion_criteria>
Your analysis is complete when:
1. All design elements are documented
2. Appropriate solid background color is determined
3. Prompt would enable accurate recreation on Imagen 4
If uncertain, choose the background that provides best contrast.
</completion_criteria>

<output_format>
<analysis>
[Detailed analysis including assessment of original background color and contrast needs]
</analysis>

<final_prompt>
[Precise description for Imagen 4. MUST END with "on a solid [color] background"]
</final_prompt>
</output_format>

CRITICAL: Never mention t-shirt/clothing. Background specification is MANDATORY.`;

export const extractDesignPrompt = async (apiKey: string, base64Image: string): Promise<string> => {
    const aiClient = getAiClient(apiKey);
    
    const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { text: SYSTEM_INSTRUCTION },
                getImagePart(base64Image)
            ]
        },
    });

    const text = response.text.trim();
    
    const finalPromptMatch = text.match(/<final_prompt>([\s\S]*?)<\/final_prompt>/);

    if (finalPromptMatch && finalPromptMatch[1]) {
        return finalPromptMatch[1].trim();
    }
    
    console.warn("Could not parse XML from design extractor. Falling back to raw text.", text);
    const analysisRemoved = text.replace(/<analysis>[\s\S]*?<\/analysis>/, '').trim();
    if (analysisRemoved) {
        return analysisRemoved;
    }
    
    throw new Error("Failed to extract a valid design prompt from the AI response.");
};
