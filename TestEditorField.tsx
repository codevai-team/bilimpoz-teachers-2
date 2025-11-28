'use client';

import { forwardRef, useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

interface TestEditorFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  height: number;
  isPreviewMode: boolean;
  onFocus: () => void;
  showResizeHandle?: boolean;
  hasError?: boolean;
}

const TestEditorField = forwardRef<any, TestEditorFieldProps>(
  ({ value, onChange, placeholder, height: initialHeight, isPreviewMode, onFocus, showResizeHandle = false, hasError = false }, ref) => {
    const [currentHeight, setCurrentHeight] = useState(initialHeight);
    const [isResizing, setIsResizing] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<any>(null);
    const startYRef = useRef<number>(0);
    const startHeightRef = useRef<number>(initialHeight);

    useEffect(() => {
      setCurrentHeight(initialHeight);
    }, [initialHeight]);

    // Управляем прокруткой: если поле неактивно, прокручиваем страницу
    useEffect(() => {
      const handleWheel = (e: WheelEvent) => {
        if (!isActive) {
          // Поле неактивно - ничего не делаем, браузер сам прокрутит страницу
          return;
        }
        
        // Поле активно - проверяем, нужно ли прокручивать содержимое поля
        const target = e.target as HTMLElement;
        const textarea = containerRef.current?.querySelector('textarea');
        
        if (textarea && (target === textarea || textarea.contains(target))) {
          // Разрешаем прокрутку внутри textarea
          const isAtTop = textarea.scrollTop === 0;
          const isAtBottom = textarea.scrollTop + textarea.clientHeight >= textarea.scrollHeight;
          
          // Если прокручиваем вверх и уже в самом верху, или вниз и в самом низу - прокручиваем страницу
          if ((e.deltaY < 0 && isAtTop) || (e.deltaY > 0 && isAtBottom)) {
            // Ничего не делаем, позволяем прокрутку страницы
            return;
          }
          // Иначе прокрутка textarea происходит автоматически
        }
      };

      const container = containerRef.current;
      if (container) {
        container.addEventListener('wheel', handleWheel, { passive: true });
      }

      return () => {
        if (container) {
          container.removeEventListener('wheel', handleWheel);
        }
      };
    }, [isActive]);

    // Обработка клика вне поля для деактивации
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsActive(false);
        }
      };

      if (isActive) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isActive]);

    // Применяем стили к scrollbar при каждом изменении высоты или значения
    useEffect(() => {
      const hideScrollbars = () => {
        if (containerRef.current) {
          const allElements = containerRef.current.querySelectorAll('*');
          allElements.forEach((el: any) => {
            if (el && el.style) {
              el.style.scrollbarWidth = 'none';
              el.style.msOverflowStyle = 'none';
            }
          });
          
          // Специально для textarea и элементов с overflow
          const scrollableElements = containerRef.current.querySelectorAll('textarea, [style*="overflow"]');
          scrollableElements.forEach((el: any) => {
            if (el && el.style) {
              el.style.scrollbarWidth = 'none';
              el.style.msOverflowStyle = 'none';
            }
          });
        }
      };

      const timeout = setTimeout(hideScrollbars, 50);
      return () => clearTimeout(timeout);
    }, [currentHeight, value]);

    // Скрываем лишние scrollbar'ы у MDEditor
    useEffect(() => {
      const styleId = 'test-editor-field-scrollbar-styles';
      let style = document.getElementById(styleId) as HTMLStyleElement;
      
      if (!style) {
        style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          .w-md-editor,
          .w-md-editor * {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          .w-md-editor::-webkit-scrollbar,
          .w-md-editor *::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          .w-md-editor-text-pre {
            overflow-y: auto !important;
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          .w-md-editor-text-pre::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          .w-md-editor-text-area,
          .w-md-editor-text-area * {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          .w-md-editor-text-area::-webkit-scrollbar,
          .w-md-editor-text-area *::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
        `;
        document.head.appendChild(style);
      }
      
      // Дополнительно применяем стили напрямую к элементам
      const applyStyles = () => {
        if (containerRef.current) {
          const editorElements = containerRef.current.querySelectorAll('.w-md-editor, .w-md-editor *, textarea');
          editorElements.forEach((el: any) => {
            if (el && el.style) {
              el.style.scrollbarWidth = 'none';
              el.style.msOverflowStyle = 'none';
              // Для webkit браузеров
              if (el.style.webkitScrollbar !== undefined) {
                el.style.webkitScrollbar = 'none';
              }
            }
          });
        }
      };
      
      // Применяем стили сразу и после небольшой задержки (на случай динамической загрузки)
      applyStyles();
      const timeout1 = setTimeout(applyStyles, 100);
      const timeout2 = setTimeout(applyStyles, 300);
      
      // Используем MutationObserver для отслеживания появления новых элементов
      let observer: MutationObserver | null = null;
      if (containerRef.current) {
        observer = new MutationObserver(() => {
          applyStyles();
        });
        observer.observe(containerRef.current, {
          childList: true,
          subtree: true,
        });
      }
      
      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        if (observer) {
          observer.disconnect();
        }
      };
    }, []);

    useEffect(() => {
      if (!isResizing) return;

      const handleMouseMove = (e: MouseEvent) => {
        const deltaY = e.clientY - startYRef.current;
        const newHeight = Math.max(60, Math.min(500, startHeightRef.current + deltaY));
        setCurrentHeight(newHeight);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isResizing]);

    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      startYRef.current = e.clientY;
      startHeightRef.current = currentHeight;
    };

    const handleClick = () => {
      if (!isActive) {
        setIsActive(true);
        onFocus();
        
        // Фокусируем textarea после активации
        setTimeout(() => {
          const textarea = containerRef.current?.querySelector('textarea');
          if (textarea) {
            textarea.focus();
          }
        }, 0);
      }
    };

    return (
        <div
          ref={containerRef}
          className={`relative rounded-lg overflow-hidden border transition-colors bg-[#151515] ${
            isActive ? 'border-white' : 'border-gray-700'
          }`}
          onClick={handleClick}
        >
        <div style={{ pointerEvents: isActive ? 'auto' : 'none' }}>
          <MDEditor 
            ref={ref}
            value={value}
            onChange={(val) => onChange(val || '')}
            preview={isPreviewMode ? "preview" : "edit"}
            hideToolbar={true}
            visibleDragbar={false}
            height={currentHeight}
            previewOptions={{
              remarkPlugins: [remarkMath],
              rehypePlugins: [rehypeKatex],
            }}
            textareaProps={{
              placeholder,
            }}
            style={{
              background: '#151515',
            }}
          />
        </div>
        {showResizeHandle && (
          <div 
            className="absolute bottom-1 right-1 cursor-se-resize hover:opacity-80 transition-opacity"
            onMouseDown={handleMouseDown}
          >
            <svg 
              className="w-8 h-8 text-gray-500"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path 
                d="M20 20L16 16M20 20L16 20M20 20L20 16" 
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}
      </div>
    );
  }
);

TestEditorField.displayName = 'TestEditorField';

export default TestEditorField;

