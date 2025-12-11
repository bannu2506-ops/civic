import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    issue_type: {
      type: Type.STRING,
      enum: [
        'POTHOLE',
        'GARBAGE_DUMP',
        'ILLEGAL_PARKING',
        'STREETLIGHT_DAMAGE',
        'BROKEN_ROAD',
        'FLOODING',
        'GRAFFITI',
        'OTHER'
      ],
      description: "The primary category of the civic issue detected."
    },
    severity: {
      type: Type.STRING,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      description: "The severity level based on size, danger, and obstruction."
    },
    confidence: {
      type: Type.NUMBER,
      description: "Confidence score between 0 and 1."
    },
    description: {
      type: Type.STRING,
      description: "A concise, technical description of the issue (1-2 sentences)."
    },
    recommended_action: {
      type: Type.STRING,
      description: "Specific action required to fix the issue."
    },
    suggested_department: {
      type: Type.STRING,
      description: "The municipal department responsible (e.g., Roads, Sanitation, Traffic)."
    },
    sla_estimate: {
      type: Type.STRING,
      description: "Recommended Service Level Agreement timeframe (e.g., '24 hours', '3 days')."
    },
    has_pii: {
      type: Type.BOOLEAN,
      description: "True if human faces or license plates are clearly visible and need blurring."
    }
  },
  required: ['issue_type', 'severity', 'confidence', 'description', 'recommended_action', 'suggested_department', 'sla_estimate', 'has_pii']
};

export const analyzeImage = async (base64Image: string, locationContext?: string): Promise<AnalysisResult> => {
  try {
    const prompt = `
      Analyze this image for civic infrastructure issues. 
      Identify problems such as potholes, garbage dumps, illegal parking, damaged streetlights, or broken roads.
      Assess the severity based on potential risk to public safety or traffic flow.
      ${locationContext ? `Location Context: ${locationContext}` : ''}
      Return the result in strict JSON format.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.2, // Low temperature for consistent classification
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const getAddressFromCoordinates = async (lat: number, lng: number): Promise<{ address: string, googleMapsUri?: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "What is the precise street address or nearest cross-street for this location? Provide a concise answer.",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      },
    });

    const address = response.text?.trim() || "Address lookup failed";
    
    // Attempt to extract the Google Maps URI from grounding metadata
    let googleMapsUri: string | undefined = undefined;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (groundingChunks && groundingChunks.length > 0) {
      // Look for a maps URI in the chunks
      // @ts-ignore
      const mapChunk = groundingChunks.find(chunk => chunk.maps?.uri);
      // @ts-ignore
      if (mapChunk) {
        // @ts-ignore
        googleMapsUri = mapChunk.maps.uri;
      }
    }

    // Fallback if no specific URI returned by grounding
    if (!googleMapsUri) {
      googleMapsUri = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }

    return { address, googleMapsUri };
  } catch (error) {
    console.error("Address Lookup Error:", error);
    return { 
      address: "Location details unavailable", 
      googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` 
    };
  }
};