// @google/genai Coding Guidelines:
// User-provided API keys are handled in this file.
// A new client is instantiated for each request with the user's key.
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ProductDetails } from '../types';
import { extractDesignPrompt } from './designExtractor';

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

export const analyzeImageColor = async (apiKey: string, base64Image: string): Promise<string> => {
    const prompt = "Analyze the image of a product with a graphic on it. Determine the dominant color of the product's material itself, ignoring the colors within the graphic design. Provide only the hex color code for this dominant background color. For example, if it's a black t-shirt with a white logo, you should return #000000. Your response must be only the hex code.";
    
    const response = await getAiClient(apiKey).models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [ { text: prompt }, getImagePart(base64Image) ] },
    });
    
    const color = response.text.trim();
    return /^#[0-9A-F]{6}$/i.test(color) ? color : '#F3F4F6'; // Default to light gray if invalid
};

const generateImage = async (apiKey: string, prompt: string, base64InputImage: string): Promise<string> => {
    const response = await getAiClient(apiKey).models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [
                getImagePart(base64InputImage),
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    // Check for explicit content blocks from the API
    if (response.promptFeedback?.blockReason) {
        let errorMessage = `Image generation failed due to: ${response.promptFeedback.blockReason}.`;
        if (response.promptFeedback.blockReasonMessage) {
            errorMessage += ` Message: ${response.promptFeedback.blockReasonMessage}`;
        }
        throw new Error(errorMessage);
    }
    
    // Check safety ratings for more detailed feedback, even if not explicitly blocked
    if (response.promptFeedback?.safetyRatings) {
        const harmfulRating = response.promptFeedback.safetyRatings.find(
            (rating) => ['HIGH', 'MEDIUM'].includes(rating.probability)
        );
        if (harmfulRating) {
            const category = harmfulRating.category.replace('HARM_CATEGORY_', '').replace(/_/g, ' ').toLowerCase();
            throw new Error(`Image generation failed. The request was filtered due to potential ${category} content.`);
        }
    }

    const parts = response.candidates?.[0]?.content?.parts;

    // Check if the API returned any content parts
    if (!parts || parts.length === 0) {
        const responseText = response.text?.trim();
        if (responseText) {
            throw new Error(`API call failed: ${responseText}`);
        }
        throw new Error("API returned an empty response. This could be due to safety filters or an unclear prompt. Please try modifying your instructions or using a different image.");
    }
    
    const imagePart = parts.find(part => part.inlineData);
    
    if (imagePart?.inlineData) {
        return `data:image/png;base64,${imagePart.inlineData.data}`;
    }

    // If no image is found, provide a more detailed error using the text part
    const textPart = parts.find(part => part.text);
    const textResponse = textPart?.text || response.text;

    if (textResponse && textResponse.trim()) {
      throw new Error(`API returned text instead of an image: "${textResponse.trim()}"`);
    }

    throw new Error("API did not return an image. Please try a different design or prompt.");
};


export const cloneDesign = async (apiKey: string, base64Image: string, additionalInstructions?: string): Promise<string> => {
    let extractedPrompt = await extractDesignPrompt(apiKey, base64Image);

    if (additionalInstructions && additionalInstructions.trim().length > 0) {
        const backgroundInstructionRegex = /( on a solid (black|white) background)$/i;
        const match = extractedPrompt.match(backgroundInstructionRegex);

        if (match) {
            const backgroundInstruction = match[0];
            const promptWithoutBackground = extractedPrompt.replace(backgroundInstructionRegex, '');
            // Append a period if one doesn't exist before adding more instructions.
            const separator = promptWithoutBackground.endsWith('.') ? '' : '.';
            extractedPrompt = `${promptWithoutBackground}${separator} Additional instructions: ${additionalInstructions}${backgroundInstruction}`;
        } else {
            // Fallback if the regex fails for some reason
            extractedPrompt += `\n\nAdditional instructions: ${additionalInstructions}`;
        }
    }

    return generateImage(apiKey, extractedPrompt, base64Image);
};


export const createMockup = async (apiKey: string, base64ClonedDesign: string, productPrompt: string, productColorHex: string, additionalInstructions?: string): Promise<string> => {
    let finalPrompt = `Take the provided design and create a photorealistic mockup. ${productPrompt}. IMPORTANT: The main color of the product (e.g., the t-shirt fabric, the mug's ceramic) MUST be the hex color: ${productColorHex}. The design must be placed naturally on the product, conforming to its shape, texture, and lighting. The final image should look like a professional product photograph.`;

    if (additionalInstructions && additionalInstructions.trim().length > 0) {
        finalPrompt += `\n\nADDITIONAL INSTRUCTIONS: ${additionalInstructions}`;
    }

    return generateImage(apiKey, finalPrompt, base64ClonedDesign);
};

export const generateProductDetails = async (apiKey: string, base64ClonedDesign: string): Promise<ProductDetails> => {
    const prompt = "Analyze the provided design. Your task is to generate marketing copy for a print-on-demand product featuring this design.";
    
    const response = await getAiClient(apiKey).models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }, getImagePart(base64ClonedDesign)] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: {
                        type: Type.STRING,
                        description: "A short, catchy, and descriptive title (max 10 words)."
                    },
                    description: {
                        type: Type.STRING,
                        description: "A compelling 2-3 sentence product description that highlights the style, mood, and potential appeal of the design."
                    },
                    tags: {
                        type: Type.STRING,
                        description: "A single comma-separated string of 10-15 relevant SEO keywords or tags."
                    }
                },
                required: ["title", "description", "tags"]
            }
        }
    });

    const jsonString = response.text.trim();
    return JSON.parse(jsonString) as ProductDetails;
};

// --- Photoroom Service ---
const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
};
  
export const removeBackground = async (apiKey: string, base64Image: string): Promise<string> => {
    if (!apiKey) {
        throw new Error("Photoroom API key is missing.");
    }
    const apiUrl = 'https://sdk.photoroom.com/v1/segment';
    const imageBlob = base64ToBlob(base64Image, 'image/png');
    const formData = new FormData();
    formData.append('image_file', imageBlob, 'design.png');
    formData.append('format', 'png'); // Request PNG for transparency
    
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'x-api-key': apiKey },
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Photoroom API Error:", errorText);
        throw new Error(`Background removal failed. Status: ${response.status}`);
    }

    const resultBlob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(resultBlob);
    });
};

/**
 * Resizes the design to a print-ready resolution of 4500x5400 pixels.
 * This implementation uses the browser's Canvas API for client-side resizing, which is fast and requires no extra API keys.
 * For different requirements, this could be swapped with a server-side resizing service.
 */
export const resizeDesign = async (base64Image: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const targetWidth = 4500;
            const targetHeight = 5400;

            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context for resizing.'));
            }

            ctx.imageSmoothingQuality = 'high';

            // Calculate dimensions to fit image within the canvas while maintaining aspect ratio
            const hRatio = targetWidth / img.width;
            const vRatio = targetHeight / img.height;
            const ratio = Math.min(hRatio, vRatio);
            const newWidth = img.width * ratio;
            const newHeight = img.height * ratio;

            // Center the image
            const xOffset = (targetWidth - newWidth) / 2;
            const yOffset = (targetHeight - newHeight) / 2;
            
            ctx.clearRect(0, 0, targetWidth, targetHeight);
            ctx.drawImage(img, xOffset, yOffset, newWidth, newHeight);

            // Return the resized image as a base64 string
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
            reject(new Error('Failed to load image for resizing.'));
        };
        img.src = base64Image;
    });
};