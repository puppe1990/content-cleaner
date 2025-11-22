import React, { useState, useCallback } from 'react';
import { cleanContentWithGemini } from './services/geminiService';
import { cleanContentLocally, convertHtmlToMarkdown } from './services/localCleaner';
import { AppStatus } from './types';
import { SparklesIcon, CodeBracketIcon, PhotoIcon, TrashIcon, CopyIcon, LightningIcon, DownloadIcon } from './components/Icons';
import { Button } from './components/Button';

const App: React.FC = () => {
  const [inputCode, setInputCode] = useState<string>('');
  const [cleanedHtml, setCleanedHtml] = useState<string>('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');

  const handleClean = useCallback(async () => {
    if (!inputCode.trim()) return;

    setStatus(AppStatus.PROCESSING);
    setErrorMessage(null);
    setCleanedHtml('');

    try {
      const result = await cleanContentWithGemini(inputCode);
      setCleanedHtml(result.cleanedHtml);
      setStatus(AppStatus.SUCCESS);
      setActiveTab('preview');
    } catch (error: any) {
      setErrorMessage(error.message || "Ocorreu um erro desconhecido.");
      setStatus(AppStatus.ERROR);
    }
  }, [inputCode]);

  const handleLocalClean = useCallback(() => {
    if (!inputCode.trim()) return;
    
    setStatus(AppStatus.PROCESSING);
    setErrorMessage(null);

    setTimeout(() => {
      try {
        const result = cleanContentLocally(inputCode);
        setCleanedHtml(result.cleanedHtml);
        setStatus(AppStatus.SUCCESS);
        setActiveTab('preview');
      } catch (error: any) {
         setErrorMessage(error.message || "Erro na limpeza local.");
         setStatus(AppStatus.ERROR);
      }
    }, 100);
  }, [inputCode]);

  const handleClear = useCallback(() => {
    setInputCode('');
    setCleanedHtml('');
    setStatus(AppStatus.IDLE);
    setErrorMessage(null);
  }, []);

  const handleCopyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(cleanedHtml);
  }, [cleanedHtml]);

  // Simple heuristic to detect if output is HTML or Markdown/Text
  const isHtmlContent = cleanedHtml.trim().startsWith('<') && !cleanedHtml.trim().startsWith('<!DOCTYPE');

  const handleDownloadMarkdown = useCallback(() => {
    if (!cleanedHtml) return;

    let contentToSave = cleanedHtml;

    // If current content is HTML, convert to Markdown before saving
    if (isHtmlContent) {
      contentToSave = convertHtmlToMarkdown(cleanedHtml);
    }

    const blob = new Blob([contentToSave], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'conteudo-limpo.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [cleanedHtml, isHtmlContent]);

  const handleSampleData = useCallback(() => {
    const sample = `
    <div class="container" style="background: #f0f0f0; padding: 20px;">
      <nav class="navbar"><ul><li>Home</li><li>About</li></ul></nav>
      <article id="main-post" class="post-content">
        <h1 style="color: blue;">O Futuro da Inteligência Artificial</h1>
        <p class="intro">A IA está mudando como interagimos com a tecnologia.</p>
        <div class="ad-banner">Compre agora!</div>
        <img src="https://picsum.photos/800/400" class="img-fluid" alt="Robô futurista" />
        <p>Existem muitas aplicações, desde <strong>chatbots</strong> até carros autônomos.</p>
        <button onclick="alert('share')">Compartilhar</button>
        <script>console.log('Tracking user...');</script>
      </article>
      <footer>Copyright 2024</footer>
    </div>`;
    setInputCode(sample);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 tracking-tight">Content Cleaner AI</h1>
              <p className="text-xs text-slate-400">Powered by Gemini 2.5 Flash</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <span className="hidden md:inline text-sm text-slate-500">Extrai texto e imagens. Remove CSS/JS.</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 gap-6 grid grid-cols-1 lg:grid-cols-2 h-[calc(100vh-80px)]">
        
        {/* Input Section */}
        <div className="flex flex-col h-full bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <CodeBracketIcon className="w-5 h-5 text-indigo-400" />
              <span>Código Original (HTML/CSS/JS)</span>
            </div>
            <div className="flex gap-2">
               <Button variant="ghost" onClick={handleSampleData} className="text-xs py-1 h-8">
                Exemplo
              </Button>
              <Button variant="ghost" onClick={handleClear} title="Limpar tudo" className="p-2">
                <TrashIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <div className="flex-1 relative">
            <textarea
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Cole seu bloco de HTML, CSS e JS aqui..."
              className="w-full h-full bg-slate-950 p-4 font-mono text-sm text-slate-300 resize-none focus:outline-none focus:ring-0 leading-relaxed"
              spellCheck={false}
            />
          </div>
          <div className="p-4 border-t border-slate-800 bg-slate-900 grid grid-cols-2 gap-4">
            <Button 
              variant="secondary"
              onClick={handleLocalClean} 
              isLoading={status === AppStatus.PROCESSING} 
              className="w-full py-3 gap-2"
            >
              <LightningIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Limpar para Markdown (Sem IA)</span>
              <span className="inline sm:hidden">Markdown</span>
            </Button>
            <Button 
              onClick={handleClean} 
              isLoading={status === AppStatus.PROCESSING} 
              className="w-full py-3 shadow-indigo-900/20 gap-2"
            >
              <SparklesIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Limpar para HTML (Com IA)</span>
              <span className="inline sm:hidden">HTML IA</span>
            </Button>
          </div>
        </div>

        {/* Output Section */}
        <div className="flex flex-col h-full bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900">
             <div className="flex p-1 bg-slate-800 rounded-lg">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'preview' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Visualizar
                </button>
                <button
                   onClick={() => setActiveTab('code')}
                   className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'code' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Código / Raw
                </button>
             </div>
             
             {status === AppStatus.SUCCESS && (
               <div className="flex gap-2">
                 <Button variant="secondary" onClick={handleDownloadMarkdown} title="Baixar Markdown" className="text-xs py-1.5 h-9 gap-2">
                   <DownloadIcon className="w-4 h-4" />
                   <span className="hidden sm:inline">MD</span>
                 </Button>
                 <Button variant="secondary" onClick={handleCopyToClipboard} className="text-xs py-1.5 h-9 gap-2">
                   <CopyIcon className="w-4 h-4" />
                   <span className="hidden sm:inline">Copiar</span>
                 </Button>
               </div>
             )}
          </div>

          <div className="flex-1 overflow-hidden relative bg-slate-950/50">
            {status === AppStatus.IDLE && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                  <PhotoIcon className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-lg font-medium text-slate-400">Aguardando input...</p>
                <p className="text-sm max-w-xs mt-2">Cole seu código à esquerda e escolha um método de limpeza.</p>
              </div>
            )}

            {status === AppStatus.ERROR && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 p-8 text-center">
                 <div className="w-16 h-16 bg-red-900/20 rounded-2xl flex items-center justify-center mb-4 border border-red-900/30">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                </div>
                <p className="text-lg font-medium">Erro ao processar</p>
                <p className="text-sm mt-2 opacity-80">{errorMessage}</p>
              </div>
            )}

            {status === AppStatus.SUCCESS && activeTab === 'preview' && (
              <div className="h-full overflow-y-auto p-6 bg-white text-slate-900 rounded-b-xl">
                {isHtmlContent ? (
                   <div 
                    className="prose prose-slate max-w-none prose-img:rounded-xl prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-indigo-600"
                    dangerouslySetInnerHTML={{ __html: cleanedHtml }} 
                   />
                ) : (
                   <div className="whitespace-pre-wrap font-mono text-sm text-slate-800 leading-relaxed">
                     {cleanedHtml}
                   </div>
                )}
              </div>
            )}

            {status === AppStatus.SUCCESS && activeTab === 'code' && (
              <textarea
                readOnly
                value={cleanedHtml}
                className="w-full h-full bg-slate-950 p-4 font-mono text-sm text-green-400 resize-none focus:outline-none"
              />
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default App;