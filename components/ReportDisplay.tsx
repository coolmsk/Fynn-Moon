
import React, { useState } from 'react';
import type { ReportData } from '../types';
import { DownloadIcon } from './icons';

interface ReportDisplayProps {
  reportData: ReportData;
  onReset: () => void;
  onRefine: (comment: string) => void;
}

// A component to render markdown-like text, including tables and bold titles.
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  const elements: (JSX.Element | {type: 'li', content: string})[] = [];
  let currentTable: string[][] = [];
  let isFirstTable = true;

  const renderTable = () => {
    if (currentTable.length < 2) { // Not a valid table (must have header and divider)
        currentTable.forEach((row, index) => {
            elements.push(<p key={`table-as-p-${elements.length}-${index}`}>{row.join(' | ')}</p>)
        });
        currentTable = [];
        return;
    };

    const isApprovalTable = isFirstTable;
    isFirstTable = false;
    
    const header = currentTable[0];
    const bodyRows = currentTable.slice(2);

    elements.push(
      <div key={`table-wrapper-${elements.length}`} className={isApprovalTable ? "flex justify-end my-4" : "my-4"}>
        <table className="border-collapse">
            <thead>
                <tr>
                    {header.map((cell, i) => (
                        <th key={i} className="border border-slate-400 dark:border-slate-600 px-4 py-1 text-center font-medium text-sm">{cell}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {bodyRows.map((row, i) => (
                    <tr key={i}>
                        {row.map((cell, j) => (
                            <td key={j} className={`border border-slate-400 dark:border-slate-600 text-center ${isApprovalTable ? "h-20 w-24" : "p-2"}`} dangerouslySetInnerHTML={{ __html: cell || '&nbsp;' }}></td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    );
    currentTable = [];
  };

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
      currentTable.push(trimmedLine.slice(1, -1).split('|').map(cell => cell.trim()));
      return;
    }

    if (currentTable.length > 0) {
      renderTable();
    }

    if (line.startsWith('## ')) {
      elements.push(<h2 key={elements.length} className="text-2xl font-bold mt-6 mb-3 border-b pb-2">{line.substring(3)}</h2>);
    } else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
      elements.push(<h1 key={elements.length} className="text-3xl font-bold my-4 text-center">{trimmedLine.substring(2, trimmedLine.length - 2)}</h1>);
    } else if (line.startsWith('* ') || line.startsWith('- ')) {
      elements.push({type: 'li', content: line.substring(2)});
    } else if (trimmedLine === '') {
      elements.push(<br key={elements.length} />);
    } else {
      elements.push(<p key={elements.length} className="mb-2">{line}</p>);
    }
  });

  if (currentTable.length > 0) {
    renderTable();
  }

  // Group list items
  const renderedContent = [];
  let listItems: JSX.Element[] = [];
  for (let i = 0; i < elements.length; i++) {
    const item = elements[i];
    // FIX: The original type guard was not specific enough for TypeScript to differentiate
    // the custom list item object from a standard JSX.Element. Checking for the existence
    // of the 'content' property is a reliable way to identify our custom object and resolve the type error.
    if (typeof item === 'object' && item && 'content' in item) {
        listItems.push(<li key={`li-${i}`}>{item.content}</li>);
    } else {
      if (listItems.length > 0) {
        renderedContent.push(<ul key={`ul-${i}`} className="mb-4 ml-5 list-disc">{listItems}</ul>);
        listItems = [];
      }
      if (React.isValidElement(item)) {
        renderedContent.push(item);
      }
    }
  }
  if (listItems.length > 0) {
    renderedContent.push(<ul key="ul-last" className="mb-4 ml-5 list-disc">{listItems}</ul>);
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

    const reportHtml = reportContentElement.innerHTML;

    // Professional styles for the print-only window
    const printStyles = `
        body {
            font-family: 'Malgun Gothic', '맑은 고딕', 'Apple SD Gothic Neo', 'Nanum Gothic', dotum, sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #000;
        }
        @page {
            size: A4;
            margin: 2cm;
        }
        h1 {
            font-size: 20pt;
            text-align: center;
            font-weight: bold;
            margin-top: 1.5rem;
            margin-bottom: 2rem;
        }
        h2 {
            font-size: 16pt;
            font-weight: bold;
            margin-top: 1.5rem;
            margin-bottom: 1rem;
            padding-bottom: 0.25rem;
            border-bottom: 1.5px solid #000;
            page-break-after: avoid;
        }
        ul {
            padding-left: 2em;
            margin-bottom: 1rem;
        }
        li {
            margin-bottom: 0.5rem;
        }
        p {
            margin-bottom: 1rem;
        }
        table {
            border-collapse: collapse;
            width: auto;
            margin-left: auto;
            margin-right: 0;
            margin-bottom: 1rem;
        }
        th, td {
            border: 1px solid #000;
            padding: 0.25rem 0.5rem;
            text-align: center;
        }
        th {
            font-weight: normal;
        }
        td {
            height: 4em;
        }
    `;

    const printWindow = window.open('', '_blank');

    if (printWindow) {
        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <title>AI 분석 보고서</title>
                <style>${printStyles}</style>
            </head>
            <body>
                ${reportHtml}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        
    } else {
        alert('팝업이 차단되었습니다. PDF 인쇄를 위해 팝업을 허용해주세요.');
    }
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