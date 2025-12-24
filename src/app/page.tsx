"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { 
  Settings2, 
  Type, 
  Eye, 
  Maximize2, 
  Minimize2, 
  Download, 
  Trash2,
  Clock,
  Focus,
  Sun,
  Moon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type FocusMode = "none" | "sentence" | "paragraph";

export default function MinimalistWritingApp() {
  const [content, setContent] = useState("");
  const [focusMode, setFocusMode] = useState<FocusMode>("sentence");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    const savedContent = localStorage.getItem("minimalist-writing-app-content");
    if (savedContent) setContent(savedContent);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("minimalist-writing-app-content", content);
    }
  }, [content, mounted]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setSelection({ start: e.target.selectionStart, end: e.target.selectionEnd });
    handleInteraction('typing');
  };

  const handleSelectionChange = () => {
    if (editorRef.current) {
      setSelection({ 
        start: editorRef.current.selectionStart, 
        end: editorRef.current.selectionEnd 
      });
    }
  };

  const contentRef = useRef(content);
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  const handleInteraction = useCallback((type: 'mouse' | 'typing') => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    if (type === 'mouse') {
      setShowControls(true);
      controlsTimeoutRef.current = setTimeout(() => {
        if (contentRef.current.length > 0) {
          setShowControls(false);
        }
      }, 3000);
    } else {
      setShowControls(false);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(true);
      }, 2000);
    }
  }, []);

  useEffect(() => {
    const onMouseMove = () => handleInteraction('mouse');
    const onKeyDown = () => handleInteraction('typing');

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("keydown", onKeyDown);
    
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("keydown", onKeyDown);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [handleInteraction]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const readingTime = Math.ceil(wordCount / 200);

  const getFocusedContent = () => {
    if (focusMode === "none") return content;

    const paragraphs = content.split("\n");
    let currentPos = 0;
    
    return paragraphs.map((p, pIndex) => {
      const start = currentPos;
      const end = start + p.length;
      currentPos = end + 1; // +1 for the \n

      const isOverlapping = selection.start <= end && selection.end >= start;

      if (focusMode === "paragraph") {
        return (
          <span 
            key={pIndex} 
            className={cn(
              "transition-opacity duration-500",
              isOverlapping ? "opacity-100" : "opacity-15"
            )}
          >
            {p}{"\n"}
          </span>
        );
      }

      if (focusMode === "sentence" && isOverlapping) {
        // Split paragraph into sentences
        const sentences = p.split(/([.!?]\s+)/);
        let sPos = start;
        return (
          <span key={pIndex}>
            {sentences.map((s, sIndex) => {
              const sStart = sPos;
              const sEnd = sStart + s.length;
              sPos = sEnd;
              const isSentenceOverlapping = selection.start <= sEnd && selection.end >= sStart;
              return (
                <span 
                  key={sIndex}
                  className={cn(
                    "transition-opacity duration-500",
                    isSentenceOverlapping ? "opacity-100" : "opacity-15"
                  )}
                >
                  {s}
                </span>
              );
            })}
            {"\n"}
          </span>
        );
      }

      return (
        <span key={pIndex} className="opacity-15">
          {p}{"\n"}
        </span>
      );
    });
  };

  const downloadContent = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `writing-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearContent = () => {
    if (confirm("Are you sure you want to clear everything?")) {
      setContent("");
    }
  };

  const [typewriterMode, setTypewriterMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typewriterMode && editorRef.current) {
      const textarea = editorRef.current;
      const updateScroll = () => {
        const { selectionStart } = textarea;
        const textBefore = textarea.value.substring(0, selectionStart);
        const linesBefore = textBefore.split('\n').length;
        const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
        const scrollPosition = (linesBefore * lineHeight) - (window.innerHeight / 2) + (lineHeight / 2);
        
        window.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });
      };
      textarea.addEventListener('input', updateScroll);
      textarea.addEventListener('click', updateScroll);
      textarea.addEventListener('keyup', updateScroll);
      return () => {
        textarea.removeEventListener('input', updateScroll);
        textarea.removeEventListener('click', updateScroll);
        textarea.removeEventListener('keyup', updateScroll);
      };
    }
  }, [typewriterMode]);

  const toggleTypewriter = () => setTypewriterMode(!typewriterMode);

  if (!mounted) return null;

  return (
    <div className={cn(
      "min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] selection:bg-black/10 dark:selection:bg-white/10 font-serif relative overflow-x-hidden",
      "before:fixed before:inset-0 before:z-[100] before:pointer-events-none before:opacity-[0.03] before:bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"
    )}>
      {/* Overlay controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-0 right-0 z-[110] p-6 flex justify-between items-center pointer-events-none"
          >
            <div className="flex items-center gap-4 pointer-events-auto">
              <h1 className="text-xs font-sans tracking-[0.3em] uppercase opacity-40 hover:opacity-100 transition-opacity cursor-default flex items-center gap-3">
                <span className="w-8 h-[1px] bg-foreground/20"></span>
                Focus
                <span className="w-8 h-[1px] bg-foreground/20"></span>
              </h1>
            </div>

            <div className="flex items-center gap-1 pointer-events-auto">
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn("h-8 w-8 transition-all duration-300", typewriterMode ? "opacity-100 text-blue-500" : "opacity-30 hover:opacity-100")}
                onClick={toggleTypewriter}
                title="Typewriter Mode"
              >
                <Type className="h-4 w-4" />
              </Button>

              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 opacity-30 hover:opacity-100 relative"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                title="Toggle Theme"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-30 hover:opacity-100">
                    <Focus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 font-sans">
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-widest opacity-50">Focus Mode</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFocusMode("none")} className="text-xs">
                    Off
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFocusMode("sentence")} className="text-xs">
                    Sentence Focus
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFocusMode("paragraph")} className="text-xs">
                    Paragraph Focus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 opacity-30 hover:opacity-100"
                onClick={toggleFullScreen}
              >
                {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-30 hover:opacity-100">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 font-sans">
                  <DropdownMenuItem onClick={downloadContent} className="text-xs">
                    <Download className="mr-2 h-3.5 w-3.5" /> Export (.txt)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={clearContent} className="text-xs text-red-500">
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Clear All
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Container */}
      <main ref={containerRef} className="max-w-2xl mx-auto px-6 py-[30vh] md:py-[40vh] min-h-screen relative">
        <div className="relative w-full">
          {/* Visual Layer for Focus Mode */}
          <div 
            className={cn(
              "absolute inset-0 pointer-events-none whitespace-pre-wrap break-words text-lg md:text-xl leading-[1.8] text-foreground transition-all duration-700",
              focusMode !== "none" ? "opacity-100 blur-none" : "opacity-0 blur-sm"
            )}
            aria-hidden="true"
          >
            {getFocusedContent()}
          </div>

          {/* Actual Editor Layer */}
          <textarea
            ref={editorRef}
            value={content}
            onChange={handleTextChange}
            onSelect={handleSelectionChange}
            onKeyUp={handleSelectionChange}
            onMouseUp={handleSelectionChange}
            className={cn(
              "w-full min-h-[50vh] bg-transparent border-none outline-none resize-none overflow-hidden z-10",
              "text-lg md:text-xl leading-[1.8] caret-foreground/40",
              "placeholder:opacity-20 transition-all duration-700",
              focusMode !== "none" ? "text-transparent" : "text-foreground opacity-100"
            )}
            placeholder="Tell your story..."
            autoFocus
            spellCheck={false}
          />
        </div>
      </main>

      {/* Bottom Status Bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-0 left-0 right-0 p-10 flex justify-center gap-12 text-[9px] font-sans tracking-[0.4em] uppercase opacity-20 hover:opacity-40 transition-opacity pointer-events-none"
          >
            <div className="flex items-center gap-2">
              <span>{wordCount} words</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{readingTime} min read</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        textarea {
          field-sizing: content;
        }
        ::selection {
          background: rgba(0, 0, 0, 0.05);
        }
        .dark ::selection {
          background: rgba(255, 255, 255, 0.05);
        }
        html {
          scrollbar-width: none;
        }
        ::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
