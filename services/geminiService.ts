
import { GoogleGenAI } from "@google/genai";
import { fileToBase64 } from "../utils/fileUtils";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

export async function extractTextFromFile(file: File): Promise<string> {
  const base64Data = await fileToBase64(file);
  const filePart = {
    inlineData: {
      mimeType: file.type,
      data: base64Data,
    },
  };

  const textPart = {
    text: "Extract all text from this file. It could be a handwritten note, a typed document, or a PDF. Return only the transcribed text, nothing else."
  };

  const response = await ai.models.generateContent({
    model: model,
    contents: { parts: [filePart, textPart] },
  });

  return response.text;
}

export async function generateReport(
    text: string, 
    author: string, 
    approvalLine: string, 
    instructions: string, 
    teamName: string, 
    reportDate: string,
    refinementInstructions?: string
): Promise<string> {
  const systemInstruction = `You are a professional report generator for Korean public institutions. Your task is to transform raw text into a formal, structured, and professional report document. The language must be formal, objective, and adhere to the standards of official Korean government documents. The output must be entirely in Korean and formatted using simple markdown (e.g., '##' for headings, '*' for bullet points).`;

  let userPrompt = `
    다음 정보를 바탕으로 공식 보고서를 작성해 주십시오.

    ## 보고서 메타데이터
    - 팀명: ${teamName}
    - 일시: ${reportDate}
    - 작성자/보고자: ${author}
    - 결재라인: ${approvalLine}
    - 추가 지시사항: ${instructions || '없음'}

    ## 원본 내용
    ---
    ${text}
    ---
    `;

    if (refinementInstructions && refinementInstructions.trim().length > 0) {
        userPrompt += `
## 기존 보고서에 대한 수정 요청사항
---
${refinementInstructions}
---

위의 수정 요청사항을 반영하여 보고서를 다시 작성해주십시오. 최종 결과물은 수정된 전체 보고서여야 합니다.
        `;
    } else {
        userPrompt += `
보고서는 제목, 개요, 주요 내용, 실행 계획 등의 체계적인 구조를 갖추어야 합니다. 보고서 상단에 팀명, 일시, 작성자, 결재라인이 명확히 명시되도록 해주십시오.
        `;
    }

  const response = await ai.models.generateContent({
    model: model,
    contents: userPrompt,
    config: {
        systemInstruction: systemInstruction,
    }
  });

  return response.text;
}
