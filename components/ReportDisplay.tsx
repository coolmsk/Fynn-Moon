
import React, { useState } from 'react';
import type { ReportData } from '../types';
import { DownloadIcon } from './icons';

interface ReportDisplayProps {
  reportData: ReportData;
  onReset: () => void;
  onRefine: (comment: string) => void;
}

// A simple component to render markdown-like text
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n').map((line, index) => {
    if (line.startsWith('## ')) {
      return <h2 key={index} className="text-2xl font-bold mt-6 mb-3 border-b pb-2">{line.substring(3)}</h2>;
    }
    if (line.startsWith('* ') || line.startsWith('- ')) {
      return <li key={index} className="ml-5 list-disc">{line.substring(2)}</li>;
    }
    if(line.trim() === '') {
        return <br key={index} />;
    }
    return <p key={index} className="mb-2">{line}</p>;
  });
  
  // Group list items
  const renderedContent = [];
  let listItems: JSX.Element[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.type === 'li') {
      listItems.push(line);
    } else {
      if (listItems.length > 0) {
        renderedContent.push(<ul key={`ul-${i}`} className="mb-4">{listItems}</ul>);
        listItems = [];
      }
      renderedContent.push(line);
    }
  }
  if (listItems.length > 0) {
      renderedContent.push(<ul key="ul-last" className="mb-4">{listItems}</ul>);
  }

  return <div>{renderedContent}</div>;
};


const ReportDisplay: React.FC<ReportDisplayProps> = ({ reportData, onReset, onRefine }) => {
  const [refinementComment, setRefinementComment] = useState('');

  const handleRefineClick = () => {
    if (!refinementComment.trim()) return;
    onRefine(refinementComment);
  };

  const handleDownloadDoc = () => {
    const reportContentElement = document.getElementById('report-content-wrapper');
    if (!reportContentElement) {
        console.error("Report content element not found");
        return;
    }

    const reportHtml = reportContentElement.innerHTML;
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
        "xmlns:w='urn:schemas-microsoft-com:office:word' " +
        "xmlns='http://www.w3.org/TR/REC-html40'>" +
        "<head><meta charset='utf-8'><title>Report</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + reportHtml + footer;

    const source = 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = 'ai-report.docx';
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };
  
  const handleDownloadPdf = () => {
    const reportContentElement = document.getElementById('report-content-wrapper');
    if (!reportContentElement) {
        console.error("Report content element not found");
        return;
    }

    // Pre-emptively remove any old print sections to prevent duplication
    const oldPrintSection = document.getElementById('print-section');
    if (oldPrintSection) {
        oldPrintSection.remove();
    }

    // Create a dedicated section for printing that is hidden from the screen
    const printSection = document.createElement('section');
    printSection.id = 'print-section';

    // Create the style element that defines screen and print visibility
    const style = document.createElement('style');
    style.textContent = `
        @media screen {
            #print-section {
                display: none;
            }
        }
        @media print {
            @page {
                size: A4;
                margin: 2cm;
            }
            /* Hide the main app content */
            body > *:not(#print-section) {
                display: none !important;
            }
            /* Show the print section and its contents */
            #print-section {
                display: block !important;
            }
            /* Apply professional print styles */
            .printable-content {
                color: #000;
                background: #fff;
                font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
                font-size: 11pt;
                line-height: 1.6;
            }
            .printable-content h2 {
                font-size: 16pt;
                font-weight: bold;
                margin-top: 24pt;
                margin-bottom: 12pt;
                padding-bottom: 4pt;
                border-bottom: 1.5px solid #000;
                page-break-after: avoid;
            }
            .printable-content ul {
                margin: 0 0 12pt 0;
                padding-left: 2em;
            }
            .printable-content li {
                list-style: disc !important;
                display: list-item !important;
                margin-bottom: 6pt;
            }
            .printable-content p {
                 margin-bottom: 12pt;
            }
            .printable-content br {
                display: block;
                content: "";
                margin-top: 12pt;
            }
        }
    `;

    // Clone the report content
    const printableContent = reportContentElement.cloneNode(true) as HTMLElement;
    printableContent.id = ''; // Avoid duplicate IDs
    printableContent.className = 'printable-content';

    // Assemble the print section
    printSection.appendChild(style);
    printSection.appendChild(printableContent);
    document.body.appendChild(printSection);

    // Define a robust cleanup function
    const cleanup = () => {
        const section = document.getElementById('print-section');
        if (section) {
            section.remove();
        }
        window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
    // A small timeout helps ensure cleanup happens even if the print dialog is cancelled quickly
    // and 'afterprint' fails to fire in some browsers.
    setTimeout(cleanup, 500);
  };


  return (
    <div className="space-y-10 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4 pb-2 border-b-2 border-indigo-200 dark:border-indigo-800">
          AI 분석 보고서
        </h2>
        <div id="report-content-wrapper" className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-lg shadow-inner prose prose-slate dark:prose-invert max-w-none">
          <MarkdownRenderer content={reportData.generatedReport} />
        </div>
      </div>

      <div className="space-y-8 pt-8 border-t-2 border-slate-200 dark:border-slate-700 no-print">
        <div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-4">보고서 다운로드</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={handleDownloadDoc} className="flex items-center justify-center w-full bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200">
                    <DownloadIcon /> DOCX 다운로드
                </button>
                <button onClick={handleDownloadPdf} className="flex items-center justify-center w-full bg-red-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 transition-all duration-200">
                    <DownloadIcon /> PDF 다운로드
                </button>
            </div>
        </div>

        <div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">추가 수정 요청</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">보고서의 내용이나 형식을 수정하고 싶다면 아래에 지시사항을 입력하세요.</p>
            <textarea
                value={refinementComment}
                onChange={(e) => setRefinementComment(e.target.value)}
                rows={4}
                placeholder="예: 어조를 더 전문적으로 바꿔주세요. 2번 항목에 대해 더 자세히 설명해주세요."
                className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition placeholder-slate-400 dark:placeholder-slate-500"
                aria-label="추가 수정 요청 입력"
            />
            <button
                onClick={handleRefineClick}
                disabled={!refinementComment.trim()}
                className="mt-3 w-full bg-slate-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-300 transition-all duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed dark:disabled:bg-slate-600"
            >
                보고서 수정하기
            </button>
        </div>
      </div>

      <div className="no-print">
        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-4 pb-2 border-b-2 border-slate-200 dark:border-slate-700">
          추출된 원본 텍스트
        </h3>
        <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg max-h-60 overflow-y-auto">
          <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{reportData.extractedText}</p>
        </div>
      </div>
      
      <div className="text-center pt-6 no-print">
        <button
          onClick={onReset}
          className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-200"
        >
          새로운 노트 분석하기
        </button>
      </div>
    </div>
  );
};

export default ReportDisplay;
