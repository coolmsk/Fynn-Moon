import React, { useState } from 'react';
import type { ReportData } from '../types';
import { DownloadIcon } from './icons';

declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
  }
}

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
  let tableCount = 0; // To identify table types

  const renderCellContent = (text: string) => {
    return text.split(/<br\s*\/?>/gi).map((part, index, arr) => (
      <React.Fragment key={index}>
        {part}
        {index < arr.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  const renderTable = () => {
    if (currentTable.length === 0) return;

    // Filter out markdown table separator lines (e.g., |:---|:---|)
    const tableData = currentTable.filter(row => !row.every(cell => /^-+$/.test(cell.replace(/:/g, ''))));
    
    if (tableCount === 0) { // Approval Table
      const header = tableData[0] || [];
      const bodyRows = tableData.slice(1);

      elements.push(
        <div key={`table-wrapper-${elements.length}`} className="flex justify-end my-4">
          <table className="border-collapse">
              <thead>
                  <tr>
                      {header.map((cell, i) => (
                          <th key={i} className="border border-slate-400 dark:border-slate-600 px-4 py-1 text-center font-medium text-sm text-slate-700 dark:text-slate-300">{renderCellContent(cell)}</th>
                      ))}
                  </tr>
              </thead>
              <tbody>
                  {bodyRows.map((row, i) => (
                      <tr key={i}>
                          {row.map((cell, j) => (
                              <td key={j} className="border border-slate-400 dark:border-slate-600 text-center h-20 w-24 text-slate-700 dark:text-slate-300">{renderCellContent(cell.trim() || '\u00A0')}</td>
                          ))}
                      </tr>
                  ))}
              </tbody>
          </table>
        </div>
      );
    } else if (tableCount === 1) { // Metadata Table
      elements.push(
        <div key={`table-wrapper-${elements.length}`} className="my-4">
          <table className="w-full border-collapse border border-slate-400 dark:border-slate-600">
              <tbody>
                  {tableData.map((row, i) => (
                     <tr key={i}>
                       <th className="w-40 border border-slate-400 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 p-2 text-center font-medium text-slate-700 dark:text-slate-300">{renderCellContent(row[0])}</th>
                       <td className="border border-slate-400 dark:border-slate-600 p-2 pl-4 text-left text-slate-700 dark:text-slate-300">{renderCellContent(row[1])}</td>
                     </tr>
                  ))}
              </tbody>
          </table>
        </div>
      );
    } else { // Generic Data Table
        const header = tableData[0] || [];
        const bodyRows = tableData.slice(1);
        elements.push(
            <div key={`table-wrapper-${elements.length}`} className="my-4 overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-slate-300 dark:border-slate-600">
                  <thead className="bg-slate-100 dark:bg-slate-700">
                      <tr>
                          {header.map((cell, i) => (
                              <th key={i} className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">{renderCellContent(cell)}</th>
                          ))}
                      </tr>
                  </thead>
                  <tbody>
                      {bodyRows.map((row, i) => (
                          <tr key={i} className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              {row.map((cell, j) => (
                                  <td key={j} className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-slate-600 dark:text-slate-300">{renderCellContent(cell.trim())}</td>
                              ))}
                          </tr>
                      ))}
                  </tbody>
              </table>
            </div>
        );
    }
    tableCount++;
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
  
  const handleDownloadPdf = async () => {
    const reportContentElement = document.getElementById('report-content-wrapper');
    if (!reportContentElement) {
        console.error("Report content element not found");
        return;
    }
    if (!window.html2canvas || !window.jspdf) {
        alert("PDF 생성 라이브러리를 로드하지 못했습니다. 페이지를 새로고침하고 다시 시도해주세요.");
        return;
    }
    
    const downloadButton = document.getElementById('pdf-download-btn');
    let originalButtonContent = '';
    if (downloadButton) {
        originalButtonContent = downloadButton.innerHTML;
        downloadButton.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            생성 중...
        `;
        downloadButton.setAttribute('disabled', 'true');
    }

    const docElement = document.documentElement;
    const wasDarkMode = docElement.classList.contains('dark');
    if (wasDarkMode) {
        docElement.classList.remove('dark');
    }
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        const canvas = await window.html2canvas(reportContentElement, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        const margin = 15;
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const usableWidth = pdfWidth - (margin * 2);
        const usableHeight = pdfHeight - (margin * 2);
        
        const imgProps = pdf.getImageProperties(imgData);
        const imgRatio = imgProps.width / imgProps.height;

        let finalWidth = usableWidth;
        let finalHeight = finalWidth / imgRatio;

        if (finalHeight > usableHeight) {
            finalHeight = usableHeight;
            finalWidth = finalHeight * imgRatio;
        }

        const xPos = margin + (usableWidth - finalWidth) / 2;
        const yPos = margin;

        pdf.addImage(imgData, 'JPEG', xPos, yPos, finalWidth, finalHeight);
        pdf.save('ai-report.pdf');

    } catch (e) {
        console.error("An error occurred while generating the PDF:", e);
        alert("PDF를 생성하는 중 오류가 발생했습니다.");
    } finally {
        if (wasDarkMode) {
            docElement.classList.add('dark');
        }
        if (downloadButton) {
            downloadButton.innerHTML = originalButtonContent;
            downloadButton.removeAttribute('disabled');
        }
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
                <button id="pdf-download-btn" onClick={handleDownloadPdf} className="flex items-center justify-center w-full bg-red-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 transition-all duration-200 disabled:opacity-75">
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