
import React, { useState } from 'react';
import type { ReportData } from '../types';
import { DownloadIcon } from './icons';

interface ReportDisplayProps {
  reportData: ReportData;
  onReset: () => void;
  onRefine: (comment: string) => void;
}

// A component to render the specific Korean official report format.
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  let currentTable: string[][] = [];
  let isFirstTable = true; // To identify the approval table

  const renderTable = () => {
    if (currentTable.length === 0) return;

    // Filter out markdown table separator lines (e.g., |:---|:---|)
    const tableData = currentTable.filter(row => !row.every(cell => /^-+$/.test(cell.replace(/:/g, ''))));
    
    if (isFirstTable) { // Approval Table
      isFirstTable = false;
      const header = tableData[0] || [];
      const bodyRows = tableData.slice(1);

      elements.push(
        <div key={`table-wrapper-${elements.length}`} className="flex justify-end my-4">
          <table className="border-collapse">
              <thead>
                  <tr>
                      {header.map((cell, i) => (
                          <th key={i} className="border border-slate-400 dark:border-slate-600 px-4 py-1 text-center font-medium text-sm text-slate-700 dark:text-slate-300">{cell}</th>
                      ))}
                  </tr>
              </thead>
              <tbody>
                  {bodyRows.map((row, i) => (
                      <tr key={i}>
                          {row.map((cell, j) => (
                              <td key={j} className="border border-slate-400 dark:border-slate-600 text-center h-20 w-24 text-slate-700 dark:text-slate-300">{cell.trim() || '\u00A0'}</td>
                          ))}
                      </tr>
                  ))}
              </tbody>
          </table>
        </div>
      );
    } else { // Metadata Table
      elements.push(
        <div key={`table-wrapper-${elements.length}`} className="my-4">
          <table className="w-full border-collapse border border-slate-400 dark:border-slate-600">
              <tbody>
                  {tableData.map((row, i) => (
                     <tr key={i}>
                       <th className="w-40 border border-slate-400 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 p-2 text-center font-medium text-slate-700 dark:text-slate-300">{row[0]}</th>
                       <td className="border border-slate-400 dark:border-slate-600 p-2 pl-4 text-left text-slate-700 dark:text-slate-300">{row[1]}</td>
                     </tr>
                  ))}
              </tbody>
          </table>
        </div>
      );
    }
    currentTable = [];
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
      currentTable.push(trimmedLine.slice(1, -1).split('|').map(cell => cell.trim()));
      // If this is the last line, render the table
      if (index === lines.length - 1) {
        renderTable();
      }
      return;
    }

    if (currentTable.length > 0) {
      renderTable();
    }

    if (trimmedLine === '보 고 서') {
        elements.push(<h1 key={index} className="text-3xl font-bold my-6 text-center tracking-[0.5em]">{trimmedLine}</h1>);
        return;
    }
    
    const level1Regex = /^\s*\d+\.\s/;
    const level2Regex = /^\s*[가-힣]\.\s/;
    const level3Regex = /^\s*\d+\)\s/;
    const level4Regex = /^\s*[가-힣]\)\s/;

    if (trimmedLine === '') {
        elements.push(<div key={index} className="h-4" />); // Spacer for empty lines
    } else if (level1Regex.test(trimmedLine)) {
        elements.push(<p key={index} className="mb-1 pl-0">{trimmedLine}</p>);
    } else if (level2Regex.test(trimmedLine)) {
        elements.push(<p key={index} className="mb-1 pl-4">{trimmedLine}</p>);
    } else if (level3Regex.test(trimmedLine)) {
        elements.push(<p key={index} className="mb-1 pl-8">{trimmedLine}</p>);
    } else if (level4Regex.test(trimmedLine)) {
        elements.push(<p key={index} className="mb-1 pl-12">{trimmedLine}</p>);
    } else {
        // For any text that doesn't match the list format, but isn't part of a table or title
        elements.push(<p key={index} className="mb-1">{trimmedLine}</p>);
    }
  });

  // Render any remaining table at the end of the content
  if (currentTable.length > 0) {
    renderTable();
  }

  return <div>{elements}</div>;
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
            letter-spacing: 0.5em;
        }
        p {
            margin-bottom: 0.25rem;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 1rem;
        }
        table.approval-table {
            width: auto;
            margin-left: auto;
            margin-right: 0;
        }
        th, td {
            border: 1px solid #000;
            padding: 0.25rem 0.5rem;
            text-align: center;
            color: #000 !important;
        }
        th {
            font-weight: bold;
            background-color: #f2f2f2;
        }
        td {
            height: 4em;
        }
        td.meta-value {
          text-align: left;
          height: auto;
        }
    `;

    // A bit of a hack to give tables classes for printing
    let printableHtml = reportHtml.replace('<table class="border-collapse">', '<table class="border-collapse approval-table">');
    printableHtml = printableHtml.replace('<table class="w-full border-collapse border border-slate-400 dark:border-slate-600">', '<table class="w-full border-collapse">');
    printableHtml = printableHtml.replace(/<td class="border border-slate-400 dark:border-slate-600 p-2 pl-4 text-left text-slate-700 dark:text-slate-300">/g, '<td class="meta-value">');


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
                ${printableHtml}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        // Wait for content to render before printing
        setTimeout(() => {
          printWindow.print();
        }, 500);
        
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