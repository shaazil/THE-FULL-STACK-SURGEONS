import axios from 'axios';
import { GeminiResponse } from '../types';
import { getGeminiKey, getGeminiUrl } from '../utils/apiKeyManager';

/**
 * Extracts procedure type from Gemini's generated notes
 */
function extractProcedureType(content: string): string {
  // Common patterns where procedure type might be found
  const patterns = [
    /procedure.*?:\s*([^.\n]+)/i,
    /diagnosis.*?:\s*([^.\n]+)/i,
    /assessment.*?:\s*([^.\n]+)/i,
    /chief complaint.*?:\s*([^.\n]+)/i,
    /(?:is|for|with)\s+(?:a|an)\s+([^.\n]+(?:surgery|procedure|examination|assessment))/i
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // If no match found with patterns, look for common procedure names
  const commonProcedures = [
    'appendectomy', 'cholecystectomy', 'colonoscopy', 'endoscopy',
    'laparoscopy', 'biopsy', 'catheterization', 'angiogram',
    'appendicitis', 'pneumonia', 'fracture', 'hypertension'
  ];
  
  for (const procedure of commonProcedures) {
    if (content.toLowerCase().includes(procedure)) {
      // Get the sentence containing the procedure
      const sentences = content.split(/[.!?]+/);
      const relevantSentence = sentences.find(s => 
        s.toLowerCase().includes(procedure)
      );
      
      if (relevantSentence) {
        // Try to get context around the procedure
        const words = relevantSentence.split(' ');
        const index = words.findIndex(w => 
          w.toLowerCase().includes(procedure)
        );
        
        if (index > 0) {
          // Get up to 5 words before and after the procedure
          const start = Math.max(0, index - 5);
          const end = Math.min(words.length, index + 5);
          return words.slice(start, end).join(' ').trim();
        }
        
        return procedure.charAt(0).toUpperCase() + procedure.slice(1);
      }
      
      return procedure.charAt(0).toUpperCase() + procedure.slice(1);
    }
  }
  
  return 'Medical Procedure';
}

/**
 * Extract tags from the generated content
 * This is a basic implementation - you may want to enhance it
 */
function extractTags(content: string): string[] {
  // Extract potential tags from conditions, procedures, medications
  const tagPatterns = [
    /diagnosis:.*?([\w\s]+)/i,
    /assessment:.*?([\w\s]+)/i, 
    /procedure:.*?([\w\s]+)/i,
    /medication:.*?([\w\s]+)/i
  ];
  
  const tags: string[] = [];
  
  for (const pattern of tagPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      tags.push(match[1].trim());
    }
  }
  
  // If no tags found, extract some keywords
  if (tags.length === 0) {
    // Common medical terms to look for
    const medicalTerms = [
      'acute', 'chronic', 'hypertension', 'diabetes', 'fracture',
      'infection', 'pain', 'examination', 'follow-up', 'surgery'
    ];
    
    for (const term of medicalTerms) {
      if (content.toLowerCase().includes(term)) {
        tags.push(term.charAt(0).toUpperCase() + term.slice(1));
      }
    }
  }
  
  return tags.slice(0, 5); // Limit to 5 tags
}

/**
 * Generates structured medical notes from a transcription using Gemini API
 */
export async function generateMedicalNotes(
  transcriptionText: string
): Promise<GeminiResponse> {
  try {
    // Get API key and URL from centralized apiKeyManager
    const GEMINI_API_KEY = await getGeminiKey();
    const GEMINI_API_URL = await getGeminiUrl();
    const API_ENDPOINT = `${GEMINI_API_URL}/models/gemini-pro:generateContent`;
    
    const response = await axios.post(
      `${API_ENDPOINT}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `You are a medical assistant specialized in creating structured medical notes from transcriptions.
Based on the following transcription, create detailed and well-formatted medical notes.

Structure the notes with these sections (only include sections that are relevant):
- PATIENT: Demographics and identifying information
- PROCEDURE/ASSESSMENT: Type of procedure or assessment being performed
- HISTORY: Relevant medical history and presenting symptoms
- PHYSICAL EXAMINATION: Objective findings
- PROCEDURE DETAILS: For surgical/procedural notes
- ASSESSMENT: Clinical impression and diagnoses
- PLAN: Treatment recommendations, medications, follow-up

Format the output in clean markdown with clear headings.
Make sure to maintain all medically relevant information.
Use appropriate medical terminology.
Be concise but thorough.

Here is the transcription:
${transcriptionText}`
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_ONLY_HIGH"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_ONLY_HIGH"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_ONLY_HIGH"
          },
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_ONLY_HIGH"
          }
        ]
      }
    );

    const generatedContent = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const procedureType = extractProcedureType(generatedContent);
    const extractedTags = extractTags(generatedContent);
    
    // Return enhanced response with additional properties needed by HomeScreen
    return {
      ...response.data,
      title: procedureType,
      content: generatedContent,
      tags: extractedTags,
      procedureType
    };
  } catch (error) {
    // Handle specific API errors
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error?.message || error.message;
      
      if (statusCode === 403) {
        throw new Error(`API key error: ${errorMessage}`);
      } else if (statusCode === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`Gemini API error (${statusCode}): ${errorMessage}`);
      }
    }
    
    throw error;
  }
}