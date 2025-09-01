
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
    refinementInstructions?: string,
    formFile?: File | null
): Promise<string> {
  const systemInstruction = `You are a professional report generator for Korean public institutions. Your task is to transform raw text into a formal, structured, and professional report document. The language must be formal, objective, and adhere to the standards of official Korean government documents. The output must be entirely in Korean and formatted using markdown, strictly following the user's specified structure. Do not add any extra explanations or text outside of the report format.`;

  if (formFile) {
    const formBase64 = await fileToBase64(formFile);
    const formPart = {
        inlineData: {
            mimeType: formFile.type,
            data: formBase64,
        },
    };

    let userPromptWithForm;
    if (refinementInstructions && refinementInstructions.trim().length > 0) {
        userPromptWithForm = `
        사용자가 보고서 템플릿 파일과 원본 내용을 제공했습니다. 이전에 생성된 보고서에 대한 사용자의 수정 요청사항도 있습니다.
        템플릿을 기반으로 원본 내용을 채워넣어 보고서를 재생성하되, 사용자의 수정 요청사항을 반드시 반영해야 합니다.

        ## 보고서 템플릿
        (업로드된 파일 참조)

        ## 원본 내용
        ---
        ${text}
        ---

        ## 수정 요청사항
        ---
        ${refinementInstructions}
        ---

        ## 보고서 메타데이터 (템플릿의 적절한 위치에 기입)
        - 팀명: ${teamName}
        - 일시: ${reportDate}
        - 작성자/보고자: ${author}
        - 결재라인: ${approvalLine}
        - 추가 지시사항: ${instructions || '없음'}

        최종 결과물은 제공된 템플릿의 구조와 스타일을 정확하게 따르는, 완성된 보고서여야 합니다. 텍스트는 한국 공공기관의 공식 문서 표준에 맞는 격식있고 객관적인 어조를 사용해야 하며, 출력은 반드시 한국어로만 이루어져야 합니다.
        `;
    } else {
        userPromptWithForm = `
        사용자가 보고서 템플릿 파일과 채워넣을 원본 내용을 제공했습니다.
        당신의 임무는 제공된 템플릿에 원본 내용을 논리적으로 정리하여 기입하고, 아래 메타데이터를 템플릿의 적절한 위치에 포함시켜 공식적인 보고서 문서를 완성하는 것입니다.

        ## 보고서 템플릿
        (업로드된 파일 참조)

        ## 원본 내용
        ---
        ${text}
        ---

        ## 보고서 메타데이터 (템플릿의 적절한 위치에 기입)
        - 팀명: ${teamName}
        - 일시: ${reportDate}
        - 작성자/보고자: ${author}
        - 결재라인: ${approvalLine}
        - 추가 지시사항: ${instructions || '없음'}

        최종 결과물은 제공된 템플릿의 구조와 스타일을 정확하게 따르는, 완성된 보고서여야 합니다. 텍스트는 한국 공공기관의 공식 문서 표준에 맞는 격식있고 객관적인 어조를 사용해야 하며, 출력은 반드시 한국어로만 이루어져야 합니다.
        `;
    }
    
    const textPart = { text: userPromptWithForm };

    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [formPart, textPart] },
        config: {
            systemInstruction: systemInstruction,
        }
    });
    return response.text;
  } else {
    // Original logic for when no form is provided
    const approvers = ['담당', ...approvalLine.split(',').map(s => s.trim()).filter(s => s)];
    const approvalHeader = `| ${approvers.join(' | ')} |`;
    const approvalSeparator = `| ${approvers.map(() => ':---').join(' | ')} |`;
    const approvalBody = `| ${approvers.map(() => ' ').join(' | ')} |`;
  
    const reportStructurePrompt = `
      보고서의 구조는 다음 지시사항을 **반드시**, **정확하게** 따라야 합니다.
  
      1.  **보고서 제목**: 보고서의 가장 첫 줄에는 '보 고 서' 라는 텍스트가 있어야 합니다. (다른 텍스트 없이 이 문구만)
  
      2.  **결재란**: 보고서 우측 상단에 표시될 결재란을 다음 형식의 마크다운 테이블로 만들어주세요.
  ${approvalHeader}
  ${approvalSeparator}
  ${approvalBody}
  
      3.  **보고서 정보**: '보 고 서' 제목 바로 아래에, 다음 정보를 포함하는 2열짜리 마크다운 테이블을 만들어주세요.
          | 팀명 | ${teamName} |
          | :--- | :--- |
          | 일시 | ${reportDate} |
          | 작성자/보고자 | ${author} |
          | 제목 | [여기에 원본 내용을 요약한 보고서 제목을 생성하여 기입하세요] |
  
      4.  **보고서 본문**: 보고서 정보 테이블 아래에, 다음의 계층적 번호 매기기 형식을 사용하여 본문을 작성해주세요.
          - **서식 규칙**: 보고서 전체(표 내부 포함)에서 제목 기호(#), 굵은 글씨/기울임 기호(*, **) 등 마크다운 서식 문자를 절대 사용하지 마세요. 모든 텍스트는 일반 텍스트 스타일을 유지해야 합니다. 표 내부에서 줄바꿈이 필요한 경우에만 예외적으로 \`<br>\` 태그를 사용하세요.
          - 본문 내용은 반드시 다음 5가지 항목 순서로 전개해야 합니다:
            1. 현황 및 개요
            2. 현황(데이터) 분석: 원본 내용을 **대외 환경**과 **대내 현황**으로 구분하여 분석해야 합니다. 각 분석에는 원본 내용의 데이터를 기반으로 한 표, 그래프 등의 도표를 **마크다운 형식으로** 1개 이상 반드시 포함하여 분석 내용을 시각적으로 제시해야 합니다.
            3. 개선방향
            4. 추진계획(세부내용)
            5. 총론
          - 각 항목 내의 세부 내용은 다음의 계층적 번호 매기기 형식을 사용하세요.
            - 가. (두 번째 수준)
            - 1) (세 번째 수준)
            - 가) (네 번째 수준)
          - **문장 스타일**: 모든 문장은 명사형으로 끝나는 **개조식**으로 작성해야 합니다. (예: "...~을 실시함.", "...~가 필요함.")
      `;
  
      let userPrompt;
  
      if (refinementInstructions && refinementInstructions.trim().length > 0) {
          userPrompt = `
  기존에 작성된 보고서가 있습니다. 아래의 수정 요청사항을 반영하여 보고서를 다시 작성해주십시오.
  
  ## 수정 요청사항
  ---
  ${refinementInstructions}
  ---
  
  ## 보고서 재작성 가이드라인 (이 가이드라인을 반드시 따라서 수정해주세요)
  ${reportStructurePrompt}
  
  ## 원본 내용 (참고용)
  ---
  ${text}
  ---
  
  최종 결과물은 위의 가이드라인과 수정 요청사항이 모두 반영된 완전한 형태의 보고서여야 합니다.
          `;
      } else {
          userPrompt = `
  다음 정보를 바탕으로 공식 보고서를 작성해 주십시오.
  
  ${reportStructurePrompt}
  
  ## 추가 지시사항
  ${instructions || '없음'}
  
  ## 원본 내용
  ---
  ${text}
  ---
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
}
