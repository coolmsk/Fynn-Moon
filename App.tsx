
import React, { useState, useCallback, useEffect } from 'react';
import { AppStep, InputMode } from './types';
import type { ReportData } from './types';
import FileUpload from './components/FileUpload';
import ReportDisplay from './components/ReportDisplay';
import Loader from './components/Loader';
import { extractTextFromFile, generateReport } from './services/geminiService';
import { HeaderIcon, FileIcon, TextIcon, SunIcon, MoonIcon } from './components/icons';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.UPLOAD);
  const [inputMode, setInputMode] = useState<InputMode>(InputMode.UPLOAD);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Inputs
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [inputText, setInputText] = useState<string>('');
  const [teamName, setTeamName] = useState<string>('');
  const [reportDate, setReportDate] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const [approvalLine, setApprovalLine] = useState<string>('');
  const [additionalInstructions, setAdditionalInstructions] = useState<string>('');

  // Results & Status
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
  }, []);

  useEffect(() => {
    const getFormattedDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}. ${month}. ${day}.`;
    };
    setReportDate(getFormattedDate());
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const isAnalysisButtonDisabled = () => {
    if (!author.trim() || !approvalLine.trim() || !teamName.trim() || !reportDate.trim()) return true;
    if (inputMode === InputMode.UPLOAD && !imageFile) return true;
    if (inputMode === InputMode.TEXT && !inputText.trim()) return true;
    return false;
  };

  const handleAnalysis = useCallback(async () => {
    if (isAnalysisButtonDisabled()) {
      setError('보고서 생성을 위한 모든 필수 항목을 입력해주세요.');
      return;
    }

    setCurrentStep(AppStep.PROCESSING);
    setError(null);
    let sourceText = '';

    try {
      if (inputMode === InputMode.UPLOAD && imageFile) {
        setLoadingMessage('파일에서 텍스트를 추출하고 있습니다...');
        sourceText = await extractTextFromFile(imageFile);
      } else if (inputMode === InputMode.TEXT) {
        sourceText = inputText;
      }

      if (!sourceText || sourceText.trim().length === 0) {
        throw new Error("원본 내용에서 텍스트를 찾을 수 없습니다. 다른 파일이나 텍스트를 사용해보세요.");
      }
      
      setLoadingMessage('입력된 내용으로 보고서를 생성 중입니다...');
      const generatedReport = await generateReport(sourceText, author, approvalLine, additionalInstructions, teamName, reportDate);

      setReportData({ extractedText: sourceText, generatedReport });
      setCurrentStep(AppStep.REPORT);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다. 다시 시도해주세요.';
      setError(errorMessage);
      setCurrentStep(AppStep.UPLOAD);
    } finally {
      setLoadingMessage('');
    }
  }, [imageFile, inputText, author, approvalLine, additionalInstructions, inputMode, teamName, reportDate]);

  const handleRefine = useCallback(async (refinementComment: string) => {
    if (!reportData?.extractedText || !refinementComment.trim()) {
        setError('수정 지시사항을 입력해주세요.');
        return;
    }

    setCurrentStep(AppStep.PROCESSING);
    setLoadingMessage('보고서를 수정하고 있습니다...');
    setError(null);

    try {
        const refinedReport = await generateReport(
            reportData.extractedText,
            author,
            approvalLine,
            additionalInstructions,
            teamName,
            reportDate,
            refinementComment
        );
        
        setReportData(prevData => prevData ? { ...prevData, generatedReport: refinedReport } : null);
        setCurrentStep(AppStep.REPORT);

    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : '보고서 수정 중 알 수 없는 오류가 발생했습니다.';
        setError(errorMessage);
        setCurrentStep(AppStep.REPORT);
    } finally {
        setLoadingMessage('');
    }
  }, [reportData, author, approvalLine, additionalInstructions, teamName, reportDate]);

  const handleReset = () => {
    setCurrentStep(AppStep.UPLOAD);
    setImageFile(null);
    setInputText('');
    setReportData(null);
    setError(null);
    setTeamName('');
    setAuthor('');
    setApprovalLine('');
    setAdditionalInstructions('');
  };

  const renderUploadStep = () => (
    <div className="space-y-8">
      <div>
        <label className="block text-lg font-bold text-slate-800 dark:text-slate-100 mb-3">1. 입력 방식 선택</label>
        <div className="flex rounded-lg border border-slate-300 dark:border-slate-700 p-1 bg-slate-100 dark:bg-slate-900/50 max-w-sm mx-auto">
          <button
            onClick={() => setInputMode(InputMode.UPLOAD)}
            className={`flex-1 flex items-center justify-center p-2 rounded-md transition-colors duration-200 text-sm font-semibold ${inputMode === InputMode.UPLOAD ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
            aria-pressed={inputMode === InputMode.UPLOAD}
          >
            <FileIcon /> 파일 업로드
          </button>
          <button
            onClick={() => setInputMode(InputMode.TEXT)}
            className={`flex-1 flex items-center justify-center p-2 rounded-md transition-colors duration-200 text-sm font-semibold ${inputMode === InputMode.TEXT ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
            aria-pressed={inputMode === InputMode.TEXT}
          >
            <TextIcon /> 텍스트 입력
          </button>
        </div>
      </div>

      <div className="mt-4">
        {inputMode === InputMode.UPLOAD ? (
          <FileUpload onFileSelect={setImageFile} />
        ) : (
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="여기에 아이디어나 메모 내용을 입력하세요..."
            className="w-full h-40 p-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition placeholder-slate-400 dark:placeholder-slate-500"
            aria-label="텍스트 아이디어 입력"
          />
        )}
      </div>

      <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">2. 보고서 정보 입력</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="teamName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">팀명 <span className="text-red-500">*</span></label>
            <input type="text" id="teamName" value={teamName} onChange={e => setTeamName(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 placeholder-slate-400 dark:placeholder-slate-500" required aria-required="true"/>
          </div>
          <div>
            <label htmlFor="reportDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">일시 <span className="text-red-500">*</span></label>
            <input type="text" id="reportDate" value={reportDate} onChange={e => setReportDate(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 placeholder-slate-400 dark:placeholder-slate-500" required aria-required="true"/>
          </div>
          <div>
            <label htmlFor="author" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">작성자/보고자 이름 <span className="text-red-500">*</span></label>
            <input type="text" id="author" value={author} onChange={e => setAuthor(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 placeholder-slate-400 dark:placeholder-slate-500" required aria-required="true"/>
          </div>
          <div>
            <label htmlFor="approvalLine" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">결재라인 <span className="text-red-500">*</span></label>
            <input type="text" id="approvalLine" value={approvalLine} onChange={e => setApprovalLine(e.target.value)} placeholder="예: 팀장, 부장, 본부장" className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 placeholder-slate-400 dark:placeholder-slate-500" required aria-required="true"/>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="instructions" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">추가 지시사항 (선택)</label>
            <textarea id="instructions" value={additionalInstructions} onChange={e => setAdditionalInstructions(e.target.value)} rows={3} className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 placeholder-slate-400 dark:placeholder-slate-500" placeholder="보고서에 특별히 포함되어야 할 내용이나 강조할 점을 입력하세요."></textarea>
          </div>
        </div>
      </div>
      
      <div className="text-center pt-6">
        <button
          onClick={handleAnalysis}
          disabled={isAnalysisButtonDisabled()}
          className="w-full max-w-sm bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-200 transform hover:scale-105 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:scale-100 dark:disabled:bg-slate-600"
        >
          공식 보고서 생성
        </button>
      </div>

    </div>
  );

  const renderContent = () => {
    switch (currentStep) {
      case AppStep.UPLOAD:
        return renderUploadStep();
      case AppStep.PROCESSING:
        return <Loader message={loadingMessage} />;
      case AppStep.REPORT:
        return reportData && <ReportDisplay reportData={reportData} onReset={handleReset} onRefine={handleRefine} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans antialiased">
      <main className="container mx-auto px-4 py-8 md:py-16 relative">
        <div className="absolute top-4 right-4 md:top-6 md:right-6">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900 transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
        </div>

        <header className="text-center mb-10 md:mb-16">
          <div className="inline-flex items-center gap-4 mb-4">
            <HeaderIcon />
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
              AI 공식 보고서 생성기
            </h1>
          </div>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            파일(이미지, PDF)이나 텍스트를 입력하면 AI가 공공기관 형식의 보고서를 자동으로 작성해줍니다.
          </p>
        </header>

        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm dark:bg-red-900/50 dark:border-red-600 dark:text-red-300" role="alert">
              <p className="font-bold">오류 발생</p>
              <p>{error}</p>
            </div>
          )}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg transition-all duration-300 p-6 md:p-10">
            {renderContent()}
          </div>
        </div>
        
        <footer className="text-center mt-12 text-slate-500 dark:text-slate-400">
          <p>Powered by Gemini AI</p>
        </footer>
      </main>
    </div>
  );
};

export default App;
