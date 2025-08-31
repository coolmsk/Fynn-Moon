
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
  const systemInstruction = `You are a professional report generator for Korean public institutions. Your task is to transform raw text into a formal, structured, and professional report document. The language must be formal, objective, and adhere to the standards of official Korean government documents. The output must be entirely in Korean and formatted using markdown. The report must start with a formal approval signature table, followed by report metadata (team, date, author), a bolded title, and then the main content.`;

  let userPrompt = `
    다음 정보를 바탕으로 공식 보고서를 작성해 주십시오. 보고서의 구조는 다음 순서를 엄격히 따라야 합니다.

    1.  **결재란**: 보고서 최상단에 다음 결재라인에 따른 결재란을 마크다운 테이블로 만들어주세요. 결재라인의 첫 번째는 작성자 본인입니다. 테이블의 첫 행은 직위/이름을, 두 번째 행은 서명을 위한 빈 칸으로 구성해주세요.
        - 결재라인: ${author}, ${approvalLine}

    2.  **보고서 정보**: 결재란 바로 아래에 다음 정보를 명시해주세요. 각 항목은 한 줄씩 차지해야 합니다.
        - 팀명: ${teamName}
        - 일시: ${reportDate}
        - 작성자: ${author}

    3.  **제목**: 보고서 정보 아래에, 원본 내용을 함축하는 '제목'을 만들어 '**'로 감싸 굵은 글씨로 표시해주세요. 이 제목은 보고서 내용과 분리된 한 줄이어야 합니다.

    4.  **보고서 본문**: 제목 아래에 보고서의 본문을 작성해주세요. 본문은 개요, 주요 내용, 실행 계획 등의 체계적인 구조를 갖추어야 합니다.

    ## 추가 지시사항
    ${instructions || '없음'}

    ## 원본 내용
    ---
    ${text}
    ---
    `;

    if (refinementInstructions && refinementInstructions.trim().length > 0) {
        userPrompt = `
기존에 작성된 보고서가 있습니다. 아래의 수정 요청사항을 반영하여 보고서를 다시 작성해주십시오.

## 수정 요청사항
---
${refinementInstructions}
---

## 보고서 재작성 가이드라인 (이 가이드라인을 반드시 따라서 수정해주세요)
아래의 구조와 정보를 사용하여 보고서 전체를 새로 생성해야 합니다.

1.  **결재란**: 보고서 최상단에 마크다운 테이블 형식의 결재란이 있어야 합니다. 첫 행은 직위/이름, 둘째 행은 빈 칸이어야 합니다.
    - 결재라인: ${author}, ${approvalLine}

2.  **보고서 정보**: 각 항목이 한 줄을 차지하도록 명시해야 합니다.
    - 팀명: ${teamName}
    - 일시: ${reportDate}
    - 작성자: ${author}

3.  **제목**: '**'로 감싸진 굵은 글씨의 제목이 별도의 한 줄에 있어야 합니다.

4.  **보고서 본문**: 체계적인 구조(개요, 주요 내용 등)를 갖춘 본문이 와야 합니다.

## 원본 내용
---
${text}
---

최종 결과물은 위의 가이드라인과 수정 요청사항이 모두 반영된 완전한 형태의 보고서여야 합니다.
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
