import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Minus,
  Maximize2,
  Minimize2,
  ExternalLink,
  MoreHorizontal,
  Send,
  Mic,
  Paperclip,
  Volume2,
  Copy,
  Check,
  BookOpen,
  Globe,
  GraduationCap,
  MessageSquare,
  Edit3,
  CheckSquare,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  Square,
} from 'lucide-react';
import { useYuyanAI } from '../../context/YuyanAIContext';
import { YuyanAIAvatar } from './YuyanAIAvatar';
import { YuyanMarkdownRenderer } from './YuyanMarkdownRenderer';
import { speechSynthesisService } from '../../services/speech/speechSynthesisService';
import { AiChatAttachment } from '../../services/ai/aiApiService';
import { ReadingMode } from '../../services/speech/speechTypes';

interface SelectedFilePreview {
  file: File;
  name: string;
  sizeFormatted: string;
  isImage: boolean;
  previewUrl?: string;
}

export const YuyanChatPanel: React.FC<{
  onNavigateToWorkspace?: () => void;
}> = ({ onNavigateToWorkspace }) => {
  const {
    isAssistantOpen,
    isMinimized,
    closeAssistant,
    minimizeAssistant,
    openVoiceModal,
    openSettingsModal,
    messages,
    sendMessage,
    isLoading,
    voiceSettings,
  } = useYuyanAI();

  const [isExpanded, setIsExpanded] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('mode') === 'expanded') return true;
      }
    } catch {
      // ignore
    }
    return false;
  });

  const [inputVal, setInputVal] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<SelectedFilePreview | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isAssistantOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAssistantOpen, isMinimized, isLoading]);

  // Clean up object URLs on unmount or file change
  useEffect(() => {
    return () => {
      if (selectedFile?.previewUrl) {
        URL.revokeObjectURL(selectedFile.previewUrl);
      }
    };
  }, [selectedFile]);

  if (!isAssistantOpen || isMinimized) return null;
  if (typeof document === 'undefined') return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const isImage = file.type.startsWith('image/');
    const isDoc =
      file.type.includes('text') ||
      file.type.includes('pdf') ||
      file.type.includes('word') ||
      file.type.includes('document') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.pdf') ||
      file.name.endsWith('.docx') ||
      file.name.endsWith('.doc');

    if (!isImage && !isDoc) {
      setFileError('Định dạng tệp chưa được hỗ trợ. Vui lòng chọn ảnh (PNG, JPG, WEBP) hoặc tài liệu (TXT, MD, PDF, DOCX).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setFileError('Dung lượng tệp vượt quá giới hạn 15MB. Vui lòng chọn tệp nhỏ hơn.');
      return;
    }

    let previewUrl: string | undefined;
    if (isImage) {
      previewUrl = URL.createObjectURL(file);
    }

    setSelectedFile({
      file,
      name: file.name,
      sizeFormatted: formatFileSize(file.size),
      isImage,
      previewUrl,
    });

    // Reset input value so the same file can be re-selected if deleted
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeSelectedFile = () => {
    if (selectedFile?.previewUrl) {
      URL.revokeObjectURL(selectedFile.previewUrl);
    }
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if ((!inputVal.trim() && !selectedFile) || isLoading || isReadingFile) return;

    const text = inputVal.trim();
    setInputVal('');

    let attachmentPayload: AiChatAttachment | null = null;

    if (selectedFile) {
      setIsReadingFile(true);
      try {
        const file = selectedFile.file;
        if (selectedFile.isImage) {
          // Read image as base64 Data URL for Gemini Vision
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
          });

          attachmentPayload = {
            name: file.name,
            type: file.type || 'image/jpeg',
            size: file.size,
            dataBase64: base64Data,
          };
        } else if (file.name.endsWith('.txt') || file.name.endsWith('.md') || file.type.includes('text')) {
          // Read text file directly as string
          const textContent = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (err) => reject(err);
            reader.readAsText(file);
          });

          attachmentPayload = {
            name: file.name,
            type: file.type || 'text/plain',
            size: file.size,
            textContent,
          };
        } else {
          // Read PDF/Document as base64
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
          });

          attachmentPayload = {
            name: file.name,
            type: file.type || 'application/pdf',
            size: file.size,
            dataBase64: base64Data,
          };
        }
      } catch (err: any) {
        console.error('File reading failed:', err);
        setFileError('Không thể đọc tệp tin được chọn. Vui lòng thử lại.');
        setIsReadingFile(false);
        return;
      } finally {
        setIsReadingFile(false);
      }

      removeSelectedFile();
    }

    void sendMessage(text, attachmentPayload);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleCopy = (id: number, text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  const handleSpeak = (id: number, text: string, mode: ReadingMode = 'all') => {
    if (speakingId === id) {
      speechSynthesisService.stop();
      setSpeakingId(null);
      return;
    }
    setSpeakingId(id);
    void speechSynthesisService.speakBilingual({
      text,
      rate: voiceSettings.speechRate,
      chineseVoiceUri: voiceSettings.chineseVoiceUri,
      vietnameseVoiceUri: voiceSettings.vietnameseVoiceUri,
      readingMode: mode,
      onEnd: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
    });
  };

  // Quick Action Buttons from reference image
  const quickActions = [
    { label: 'Giải thích', icon: BookOpen, prompt: 'Giải thích chi tiết ngữ pháp và cách dùng từ: ' },
    { label: 'Dịch thuật', icon: Globe, prompt: 'Dịch câu văn này sang tiếng Trung chuẩn xác: ' },
    { label: 'Luyện nói', icon: MessageSquare, prompt: 'Hãy đóng vai và luyện hội thoại giao tiếp tiếng Trung cùng tôi về chủ đề: ' },
    { label: 'Phân tích HSK', icon: GraduationCap, prompt: 'Phân tích đề thi HSK và hướng dẫn mẹo làm bài cho: ' },
    { label: 'Viết & sửa lỗi', icon: Edit3, prompt: 'Sửa lỗi ngữ pháp và viết lại tự nhiên cho câu: ' },
    { label: 'Tạo bài tập', icon: CheckSquare, prompt: 'Tạo 3 câu bài tập trắc nghiệm tiếng Trung cho chủ đề: ' },
  ];

  return createPortal(
    <>
      {/* Mobile-only safe backdrop (< md) at z-backdrop (45) */}
      <div
        className="fixed inset-0 z-backdrop bg-black/50 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
        onClick={closeAssistant}
        aria-hidden="true"
      />

      {/* Hidden file input for functional attachment picker */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/png,image/jpeg,image/webp,.txt,.md,.pdf,.doc,.docx"
        className="hidden"
      />

      {/* Floating / Responsive AI Chat Panel at z-chat (50) */}
      <div
        role="dialog"
        aria-label="Cửa sổ trò chuyện Yuyan AI"
        className={`fixed z-chat bottom-0 left-0 right-0 md:left-auto md:bottom-6 md:right-6 ${
          isExpanded
            ? 'w-[calc(100vw-32px)] sm:w-[560px] md:w-[680px] h-[90vh] md:h-[680px]'
            : 'w-[calc(100vw-32px)] sm:w-[420px] h-[85vh] md:h-[600px]'
        } max-w-full md:max-w-[calc(100vw-48px)] max-h-[90vh] md:max-h-[calc(100vh-80px)] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-t-3xl md:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden isolate transition-all duration-200`}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* 1. Header (100% Solid) */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 select-none">
          <div className="flex items-center gap-2.5">
            <YuyanAIAvatar size="sm" showOnlineStatus={true} />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-none">Yuyan AI</h3>
                <span className="inline-block w-2 h-2 rounded-full bg-status-success animate-pulse" />
              </div>
              <span className="text-2xs text-status-success font-medium">Đang online</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            {/* Settings button */}
            <button
              onClick={openSettingsModal}
              className="p-1.5 rounded-xl hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Cài đặt âm thanh và giọng đọc"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {/* Toggle Expand / Normal mode */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-xl hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors hidden sm:block"
              title={isExpanded ? 'Thu về dạng nhỏ' : 'Mở rộng khung trò chuyện'}
            >
              {isExpanded ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Navigate to full AI workspace page */}
            {onNavigateToWorkspace && (
              <button
                onClick={onNavigateToWorkspace}
                className="p-1.5 rounded-xl hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors hidden sm:block"
                title="Mở không gian AI toàn trang (/ai)"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Minimize */}
            <button
              onClick={minimizeAssistant}
              className="p-1.5 rounded-xl hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Thu nhỏ"
            >
              <Minus className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={() => {
                speechSynthesisService.stop();
                closeAssistant();
              }}
              className="p-1.5 rounded-xl hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Conversation Message List (100% Solid) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-white dark:bg-slate-900 custom-scrollbar text-xs">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && <YuyanAIAvatar size="sm" className="mt-1 shrink-0" />}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-2xs space-y-2 ${
                    isUser
                      ? 'bg-primary text-white rounded-br-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700 rounded-bl-xs'
                  }`}
                >
                  {/* User attachment display */}
                  {isUser && msg.attachment && (
                    <div className="pb-2 border-b border-white/20">
                      {msg.attachment.type.startsWith('image/') && msg.attachment.dataBase64 ? (
                        <img
                          src={msg.attachment.dataBase64}
                          alt={msg.attachment.name}
                          className="max-h-44 rounded-xl border border-white/30 object-cover w-full"
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-white/15">
                          <FileText className="w-4 h-4 shrink-0 text-white" />
                          <span className="text-2xs font-semibold truncate text-white">
                            {msg.attachment.name}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Body: Use Markdown Renderer for AI messages */}
                  {isUser ? (
                    <div className="leading-relaxed whitespace-pre-wrap break-words font-sans text-xs">
                      {msg.text}
                    </div>
                  ) : (
                    <YuyanMarkdownRenderer content={msg.text} fontSize="sm" />
                  )}

                  {/* Sub-actions for AI Message */}
                  {!isUser && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-1.5 text-2xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSpeak(msg.id, msg.text, 'all')}
                          className={`p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 ${
                            speakingId === msg.id ? 'text-primary font-bold' : 'text-slate-500 dark:text-slate-400'
                          }`}
                          title="Nghe phát âm song ngữ (Trung - Việt)"
                        >
                          {speakingId === msg.id ? (
                            <Square className="w-3.5 h-3.5 fill-current text-primary" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                          <span className="text-3xs hidden sm:inline">Phát âm</span>
                        </button>

                        <button
                          onClick={() => handleSpeak(msg.id, msg.text, 'chinese_only')}
                          className="px-1.5 py-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-3xs text-text-secondary transition-colors"
                          title="Chỉ nghe các đoạn chữ Hán tiếng Trung"
                        >
                          🇨🇳 Tiếng Trung
                        </button>

                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors ml-0.5"
                          title="Sao chép nội dung"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-status-success" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Interactive Quick Context Suggestions */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => void sendMessage(`Giải thích sâu hơn về: "${msg.text.slice(0, 40)}"`)}
                          className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-primary/20 hover:text-primary transition-colors font-medium text-slate-700 dark:text-slate-200 text-3xs"
                        >
                          Giải thích sâu hơn
                        </button>
                        <button
                          onClick={() => void sendMessage(`Thêm ví dụ thực tế cho: "${msg.text.slice(0, 40)}"`)}
                          className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-primary/20 hover:text-primary transition-colors font-medium text-slate-700 dark:text-slate-200 text-3xs"
                        >
                          Thêm ví dụ
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2.5 items-center text-xs text-slate-500 dark:text-slate-400 pl-9">
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
              <span className="text-2xs font-medium ml-1">
                {isReadingFile ? 'Đang đọc và xử lý tệp tin...' : 'Yuyan AI đang soạn câu trả lời...'}
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 3. Quick Actions Pill Bar (Clean overflow without native scrollbar tracks) */}
        <div
          className="flex-shrink-0 px-3 py-1.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex items-center gap-1.5 overflow-x-auto select-none"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {quickActions.map((qa, idx) => {
            const Icon = qa.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  setInputVal(qa.prompt);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-2xs font-semibold text-slate-700 dark:text-slate-200 hover:text-primary hover:border-primary/40 shrink-0 transition-all active:scale-95 shadow-2xs"
              >
                <Icon className="w-3 h-3 text-primary" />
                <span>{qa.label}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Attachment Preview Strip */}
        {selectedFile && (
          <div className="flex-shrink-0 px-3 py-2 bg-primary/5 dark:bg-primary/10 border-t border-primary/20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {selectedFile.isImage && selectedFile.previewUrl ? (
                <img
                  src={selectedFile.previewUrl}
                  alt="Preview"
                  className="w-8 h-8 rounded-lg object-cover border border-primary/30 shrink-0"
                />
              ) : selectedFile.isImage ? (
                <ImageIcon className="w-5 h-5 text-primary shrink-0" />
              ) : (
                <FileText className="w-5 h-5 text-primary shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-text-primary truncate">{selectedFile.name}</p>
                <p className="text-3xs text-text-muted">{selectedFile.sizeFormatted}</p>
              </div>
            </div>

            <button
              onClick={removeSelectedFile}
              className="p-1 rounded-lg text-text-muted hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title="Xóa tệp đính kèm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* File Error Alert */}
        {fileError && (
          <div className="flex-shrink-0 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-2xs flex items-center gap-1.5 border-t border-rose-200 dark:border-rose-800">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="flex-1">{fileError}</span>
            <button onClick={() => setFileError(null)} className="p-0.5 hover:text-rose-800">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* 4. Message Composer (100% Solid) */}
        <div className="flex-shrink-0 p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:pb-3 flex items-end gap-2">
          {/* Functional File Attachment Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`p-2 rounded-xl transition-colors shrink-0 ${
              selectedFile
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Đính kèm ảnh bài tập hoặc tài liệu (PNG, JPG, PDF, TXT, DOCX)"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Textarea */}
          <textarea
            rows={1}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedFile ? 'Nhập câu hỏi về tệp đính kèm...' : 'Nhập câu hỏi của em...'}
            className="flex-1 max-h-24 p-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-primary resize-none custom-scrollbar"
          />

          {/* Microphone Voice Mode button */}
          <button
            onClick={openVoiceModal}
            className="p-2 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 transition-colors shrink-0"
            title="Mở hội thoại giọng nói (Voice Mode)"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={(!inputVal.trim() && !selectedFile) || isLoading || isReadingFile}
            className={`p-2 rounded-full text-white transition-all shrink-0 ${
              (inputVal.trim() || selectedFile) && !isLoading && !isReadingFile
                ? 'bg-primary hover:bg-primary-hover shadow-xs active:scale-95'
                : 'bg-primary/40 cursor-not-allowed'
            }`}
            title="Gửi câu hỏi"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>,
    document.body
  );
};
