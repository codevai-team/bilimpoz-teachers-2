'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '@/components/ui/Icons';
import { useTranslation } from '@/hooks/useTranslation';
import { useMobileKeyboard } from '@/hooks/useMobileKeyboard';
import Tooltip from '@/components/ui/Tooltip';
import { PiSigma, PiFunction } from 'react-icons/pi';
import { AILoadingAnimation } from '@/components/ui/AILoadingAnimation';

interface ActiveFormats {
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  underline: boolean;
}

interface TestToolbarProps {
  onFormat: (format: string) => void;
  isPreviewMode: boolean;
  onImageToLatex?: () => void;
  onMagicWand?: () => void;
  onSaveSelection?: () => void;
  onTogglePreview?: () => void;
  onExplainQuestion?: () => void;
  activeFormats?: ActiveFormats;
  isAiLoading?: boolean;
  isImageConverting?: boolean;
  isKeyboardOpen?: boolean;
}

export default function TestToolbar({ onFormat, isPreviewMode, onImageToLatex, onMagicWand, onSaveSelection, onTogglePreview, onExplainQuestion, activeFormats, isAiLoading = false, isImageConverting = false, isKeyboardOpen = false }: TestToolbarProps) {
  const { t } = useTranslation();
  const { isKeyboardOpen: mobileKeyboardOpen, isMobile } = useMobileKeyboard();
  const [showAiDropdown, setShowAiDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ bottom: '96px', left: '50%' });
  const aiDropdownRef = useRef<HTMLDivElement>(null);
  const aiButtonRef = useRef<HTMLButtonElement>(null);
  const previewButtonRef = useRef<HTMLButtonElement>(null);
  const savedActiveElementRef = useRef<HTMLElement | null>(null);

  // Используем состояние клавиатуры из хука для мобильных устройств
  const effectiveKeyboardOpen = isMobile ? mobileKeyboardOpen : isKeyboardOpen;

  // Монтирование компонента
  useEffect(() => {
    setMounted(true);
  }, []);

  // Обновление позиции выпадающего меню при его открытии или изменении состояния клавиатуры
  useEffect(() => {
    if (showAiDropdown && aiButtonRef.current) {
      const buttonRect = aiButtonRef.current.getBoundingClientRect();
      
      // Вычисляем позицию меню ВЫШЕ кнопки с дополнительным отступом
      let bottomPosition = window.innerHeight - buttonRect.top + 12; // 12px отступ над кнопкой (было 8px)
      
      // На мобильных с открытой клавиатурой корректируем позицию
      if (isMobile && effectiveKeyboardOpen) {
        // Используем визуальную высоту viewport для более точного позиционирования
        const visualHeight = window.visualViewport?.height || window.innerHeight;
        bottomPosition = visualHeight - buttonRect.top + 12;
      }
      
      // Позиционируем меню так, чтобы его левый край был на уровне правого края кнопки
      const leftPosition = buttonRect.right; // Левый край меню = правый край кнопки
      
      setDropdownPosition({
        bottom: `${bottomPosition}px`,
        left: `${leftPosition}px`,
      });
    }
  }, [showAiDropdown, effectiveKeyboardOpen, isMobile]);

  // Сохранение активного элемента при открытии меню
  useEffect(() => {
    if (showAiDropdown) {
      // Сохраняем активный элемент при открытии меню
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && activeElement.tagName === 'TEXTAREA') {
        savedActiveElementRef.current = activeElement;
        console.log('💾 Сохранен активный элемент при открытии меню:', activeElement.tagName);
      } else {
        // Ищем последний активный textarea
        const allTextareas = document.querySelectorAll('textarea');
        if (allTextareas.length > 0) {
          savedActiveElementRef.current = allTextareas[allTextareas.length - 1] as HTMLElement;
          console.log('💾 Сохранен последний textarea при открытии меню');
        }
      }
    } else {
      // Восстанавливаем фокус при закрытии меню (если не было клика по функции)
      if (savedActiveElementRef.current && savedActiveElementRef.current.tagName === 'TEXTAREA') {
        setTimeout(() => {
          savedActiveElementRef.current?.focus();
          savedActiveElementRef.current = null;
        }, 100);
      }
    }
  }, [showAiDropdown]);

  // Закрытие дропдауна при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      // Проверяем, что клик не по кнопке AI и не по выпадающему меню
      if (
        aiDropdownRef.current && 
        !aiDropdownRef.current.contains(target) &&
        aiButtonRef.current &&
        !aiButtonRef.current.contains(target)
      ) {
        setShowAiDropdown(false);
        // Восстанавливаем фокус при закрытии меню
        setTimeout(() => {
          if (savedActiveElementRef.current && savedActiveElementRef.current.tagName === 'TEXTAREA') {
            savedActiveElementRef.current.focus();
          }
          savedActiveElementRef.current = null;
        }, 0);
      }
    };
    if (showAiDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showAiDropdown]);

  return (
    <div className="bg-[var(--bg-card)] rounded-xl sm:rounded-2xl border border-gray-700 transition-colors max-w-[calc(100vw-32px)] sm:max-w-none shadow-lg">
      <div className="flex items-center gap-0.5 sm:gap-2 p-1.5 sm:p-3 md:p-4 overflow-x-auto scrollbar-hide">
        {/* Жирный */}
        <Tooltip text={t('tooltips.bold')}>
          <button
            type="button"
            onClick={() => onFormat('bold')}
            className={`p-1.5 sm:p-2.5 rounded-md sm:rounded-lg transition-colors group ${
              activeFormats?.bold ? 'bg-[var(--text-primary)]/20 hover:bg-[var(--text-primary)]/30' : 'hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)]'
            }`}
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors" viewBox="0 0 384 512" fill="currentColor" style={{ color: activeFormats?.bold ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
              <path fill="currentColor" d="M304.793 243.891c33.639-18.537 53.657-54.16 53.657-95.693 0-48.236-26.25-87.626-68.626-104.179C265.138 34.01 240.849 32 209.661 32H24c-8.837 0-16 7.163-16 16v33.049c0 8.837 7.163 16 16 16h33.113v318.53H24c-8.837 0-16 7.163-16 16V464c0 8.837 7.163 16 16 16h195.69c24.203 0 44.834-1.289 66.866-7.584C337.52 457.193 376 410.647 376 350.014c0-52.168-26.573-91.684-71.207-106.123zM142.217 100.809h67.444c16.294 0 27.536 2.019 37.525 6.717 15.828 8.479 24.906 26.502 24.906 49.446 0 35.029-20.32 56.79-53.029 56.79h-76.846V100.809zm112.642 305.475c-10.14 4.056-22.677 4.907-31.409 4.907h-81.233V281.943h84.367c39.645 0 63.057 25.38 63.057 63.057.001 28.425-13.66 52.483-34.782 61.284z" />
            </svg>
          </button>
        </Tooltip>

        {/* Курсив */}
        <Tooltip text={t('tooltips.italic')}>
          <button
            type="button"
            onClick={() => onFormat('italic')}
            className={`p-2.5 rounded-lg transition-colors group ${
              activeFormats?.italic ? 'bg-[var(--text-primary)]/20 hover:bg-[var(--text-primary)]/30' : 'hover:bg-[var(--bg-hover)]'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 320 512" className={`transition-colors ${
              activeFormats?.italic ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]'
            }`}>
              <path fill="currentColor" d="M204.758 416h-33.849l62.092-320h40.725a16 16 0 0 0 15.704-12.937l6.242-32C297.599 41.184 290.034 32 279.968 32H120.235a16 16 0 0 0-15.704 12.937l-6.242 32C96.362 86.816 103.927 96 113.993 96h33.846l-62.09 320H46.278a16 16 0 0 0-15.704 12.935l-6.245 32C22.402 470.815 29.967 480 40.034 480h158.479a16 16 0 0 0 15.704-12.935l6.245-32c1.927-9.88-5.638-19.065-15.704-19.065z" />
            </svg>
          </button>
        </Tooltip>

        {/* Зачёркнутый */}
        <Tooltip text={t('tooltips.strikethrough')}>
          <button
            type="button"
            onClick={() => onFormat('strikethrough')}
            className={`p-2.5 rounded-lg transition-colors group ${
              activeFormats?.strikethrough ? 'bg-[var(--text-primary)]/20 hover:bg-[var(--text-primary)]/30' : 'hover:bg-[var(--bg-hover)]'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 512 512" className={`transition-colors ${
              activeFormats?.strikethrough ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]'
            }`}>
              <path fill="currentColor" d="M496 288H16c-8.837 0-16-7.163-16-16v-32c0-8.837 7.163-16 16-16h480c8.837 0 16 7.163 16 16v32c0 8.837-7.163 16-16 16zm-214.666 16c27.258 12.937 46.524 28.683 46.524 56.243 0 33.108-28.977 53.676-75.621 53.676-32.325 0-76.874-12.08-76.874-44.271V368c0-8.837-7.164-16-16-16H113.75c-8.836 0-16 7.163-16 16v19.204c0 66.845 77.717 101.82 154.487 101.82 88.578 0 162.013-45.438 162.013-134.424 0-19.815-3.618-36.417-10.143-50.6H281.334zm-30.952-96c-32.422-13.505-56.836-28.946-56.836-59.683 0-33.92 30.901-47.406 64.962-47.406 42.647 0 64.962 16.593 64.962 32.985V136c0 8.837 7.164 16 16 16h45.613c8.836 0 16-7.163 16-16v-30.318c0-52.438-71.725-79.875-142.575-79.875-85.203 0-150.726 40.972-150.726 125.646 0 22.71 4.665 41.176 12.777 56.547h129.823z" />
            </svg>
          </button>
        </Tooltip>

        {/* Подчёркнутый */}
        <Tooltip text={t('tooltips.underline')}>
          <button
            type="button"
            onClick={() => onFormat('underline')}
            className={`p-2.5 rounded-lg transition-colors group ${
              activeFormats?.underline ? 'bg-[var(--text-primary)]/20 hover:bg-[var(--text-primary)]/30' : 'hover:bg-[var(--bg-hover)]'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={`transition-colors ${
              activeFormats?.underline ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]'
            }`} stroke="currentColor" strokeWidth="2">
              <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3M4 21h16" />
            </svg>
          </button>
        </Tooltip>

        <div className="w-px h-6 bg-gray-700 mx-1" />

        {/* Формула в строке */}
        <Tooltip text={t('testEditor.inlineFormula')}>
          <button
            type="button"
            onClick={() => onFormat('inline-formula')}
            className="p-2.5 hover:bg-[var(--bg-hover)] rounded-lg transition-colors group"
          >
            <PiSigma className="text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors" size={18} style={{ fontWeight: 'bold' }} />
          </button>
        </Tooltip>

        {/* Формула в блоке */}
        <Tooltip text={t('testEditor.blockFormula')}>
          <button
            type="button"
            onClick={() => onFormat('block-formula')}
            className="p-2.5 hover:bg-[var(--bg-hover)] rounded-lg transition-colors group"
          >
            <PiFunction className="text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors" size={18} style={{ fontWeight: 'bold' }} />
          </button>
        </Tooltip>

        <div className="w-px h-6 bg-gray-700 mx-1" />

        {/* AI кнопка с выпадающим меню */}
        <div className="relative z-[99999]" ref={aiDropdownRef}>
          <Tooltip text={t('tooltips.ai')}>
            <button
              ref={aiButtonRef}
              type="button"
              onMouseDown={(e) => {
                // Сохраняем активный элемент перед открытием меню
                savedActiveElementRef.current = document.activeElement as HTMLElement;
                e.preventDefault(); // Предотвращаем потерю фокуса
              }}
              onTouchStart={(e) => {
                // Для мобильных устройств также сохраняем активный элемент
                savedActiveElementRef.current = document.activeElement as HTMLElement;
                e.preventDefault();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🤖 AI кнопка нажата, текущее состояние:', showAiDropdown);
                setShowAiDropdown(!showAiDropdown);
              }}
              className={`p-2.5 rounded-lg transition-colors group ${
                showAiDropdown ? 'bg-[var(--bg-hover)]' : 'hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)]'
              }`}
            >
              {isImageConverting ? (
                <AILoadingAnimation isActive={true} size={18} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 512 512" className={`transition-colors ${
                  showAiDropdown ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]'
                }`}>
                  <path fill="currentColor" d="M 327.5 85.2 c -4.5 1.7 -7.5 6 -7.5 10.8 s 3 9.1 7.5 10.8 L 384 128 l 21.2 56.5 c 1.7 4.5 6 7.5 10.8 7.5 s 9.1 -3 10.8 -7.5 L 448 128 l 56.5 -21.2 c 4.5 -1.7 7.5 -6 7.5 -10.8 s -3 -9.1 -7.5 -10.8 L 448 64 L 426.8 7.5 C 425.1 3 420.8 0 416 0 s -9.1 3 -10.8 7.5 L 384 64 L 327.5 85.2 Z M 205.1 73.3 c -2.6 -5.7 -8.3 -9.3 -14.5 -9.3 s -11.9 3.6 -14.5 9.3 L 123.3 187.3 L 9.3 240 C 3.6 242.6 0 248.3 0 254.6 s 3.6 11.9 9.3 14.5 l 114.1 52.7 L 176 435.8 c 2.6 5.7 8.3 9.3 14.5 9.3 s 11.9 -3.6 14.5 -9.3 l 52.7 -114.1 l 114.1 -52.7 c 5.7 -2.6 9.3 -8.3 9.3 -14.5 s -3.6 -11.9 -9.3 -14.5 L 257.8 187.4 L 205.1 73.3 Z M 384 384 l -56.5 21.2 c -4.5 1.7 -7.5 6 -7.5 10.8 s 3 9.1 7.5 10.8 L 384 448 l 21.2 56.5 c 1.7 4.5 6 7.5 10.8 7.5 s 9.1 -3 10.8 -7.5 L 448 448 l 56.5 -21.2 c 4.5 -1.7 7.5 -6 7.5 -10.8 s -3 -9.1 -7.5 -10.8 L 448 384 l -21.2 -56.5 c -1.7 -4.5 -6 -7.5 -10.8 -7.5 s -9.1 3 -10.8 7.5 L 384 384 Z"/>
                </svg>
              )}
            </button>
          </Tooltip>

          {/* Выпадающее меню вверх - рендерим через портал */}
          {showAiDropdown && mounted && typeof window !== 'undefined' && createPortal(
            <div 
              ref={aiDropdownRef}
              className="fixed bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg shadow-2xl overflow-hidden min-w-[200px] sm:min-w-[220px] z-[99999]"
              style={{
                bottom: dropdownPosition.bottom,
                left: dropdownPosition.left,
                transform: 'translateX(-50%)', // Меню начинается от правого края кнопки
              }}
              onMouseEnter={() => {
                // Сохраняем активный элемент при наведении на меню
                if (!savedActiveElementRef.current) {
                  savedActiveElementRef.current = document.activeElement as HTMLElement;
                  console.log('💾 Сохранен активный элемент при наведении на меню');
                }
              }}
            >
              {/* Изображение в LaTeX */}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // Предотвращаем потерю фокуса
                }}
                onTouchStart={(e) => {
                  e.preventDefault(); // Предотвращаем потерю фокуса на мобильных
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🖼️ Клик по кнопке "Изображение в LaTeX"');
                  onImageToLatex?.();
                  setShowAiDropdown(false);
                  // Восстанавливаем фокус на сохраненном элементе
                  setTimeout(() => {
                    if (savedActiveElementRef.current && savedActiveElementRef.current.tagName === 'TEXTAREA') {
                      savedActiveElementRef.current.focus();
                    }
                    savedActiveElementRef.current = null;
                  }, 100);
                }}
                className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 sm:gap-3"
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <svg width="14" height="14" className="sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <PiSigma size={14} className="sm:w-4 sm:h-4" />
                </div>
                <span className="text-xs sm:text-sm">Изображение в LaTeX</span>
              </button>
            </div>,
            document.body
          )}
        </div>

        <div className="flex-1" />

        {/* Кнопка волшебной палочки - улучшение текста AI */}
        {onMagicWand && (
          <div className="relative flex items-center w-[42px] h-[42px]">
            {isAiLoading ? (
              <div className="p-2.5 flex items-center justify-center w-full h-full">
                <AILoadingAnimation isActive={true} size={18} />
              </div>
            ) : (
              <Tooltip text={t('tooltips.aiImproveText')}>
                <button
                  type="button"
                  data-magic-wand-button="true"
                  onMouseDown={(e) => {
                    // Сохраняем выделение ДО того, как произойдет blur
                    // preventDefault предотвращает потерю фокуса
                    e.preventDefault()
                    onSaveSelection?.()
                    
                    // Используем requestAnimationFrame для обработки после сохранения выделения
                    requestAnimationFrame(() => {
                      onMagicWand?.()
                    })
                  }}
                  className="p-2.5 hover:bg-[var(--bg-hover)] rounded-lg transition-colors group relative w-full h-full flex items-center justify-center"
                >
                  <svg width="18" height="18" viewBox="0 0 576 512" className="text-purple-400 group-hover:text-purple-300 transition-colors" fill="currentColor">
                    <path d="M234.7 42.7L197 56.8c-3 1.1-5 4-5 7.2s2 6.1 5 7.2l37.7 14.1L248.8 123c1.1 3 4 5 7.2 5s6.1-2 7.2-5l14.1-37.7L315 71.2c3-1.1 5-4 5-7.2s-2-6.1-5-7.2L277.3 42.7 263.2 5c-1.1-3-4-5-7.2-5s-6.1 2-7.2 5L234.7 42.7zM46.1 395.4c-18.7 18.7-18.7 49.1 0 67.9l34.6 34.6c18.7 18.7 49.1 18.7 67.9 0L529.9 116.5c18.7-18.7 18.7-49.1 0-67.9L495.3 14.1c-18.7-18.7-49.1-18.7-67.9 0L46.1 395.4zM484.6 82.6l-105 105-23.3-23.3 105-105 23.3 23.3zM7.5 117.2C3 118.9 0 123.2 0 128s3 9.1 7.5 10.8L64 160l21.2 56.5c1.7 4.5 6 7.5 10.8 7.5s9.1-3 10.8-7.5L128 160l56.5-21.2c4.5-1.7 7.5-6 7.5-10.8s-3-9.1-7.5-10.8L128 96 106.8 39.5C105.1 35 100.8 32 96 32s-9.1 3-10.8 7.5L64 96 7.5 117.2zm352 256c-4.5 1.7-7.5 6-7.5 10.8s3 9.1 7.5 10.8L416 416l21.2 56.5c1.7 4.5 6 7.5 10.8 7.5s9.1-3 10.8-7.5L480 416l56.5-21.2c4.5-1.7 7.5-6 7.5-10.8s-3-9.1-7.5-10.8L480 352l-21.2-56.5c-1.7-4.5-6-7.5-10.8-7.5s-9.1 3-10.8 7.5L416 352l-56.5 21.2z"/>
                  </svg>
                </button>
              </Tooltip>
            )}
          </div>
        )}

        {/* Кнопка превью */}
        {onTogglePreview && (
        <Tooltip text={isPreviewMode ? 'Режим редактирования' : 'Режим предпросмотра'}>
          <button
            ref={previewButtonRef}
            type="button"
            onClick={onTogglePreview}
            className={`p-2.5 rounded-lg transition-colors group ${
              isPreviewMode ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)]'
            }`}
          >
            {isPreviewMode ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-colors">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:text-[var(--text-primary)] transition-colors">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </Tooltip>
        )}
      </div>
    </div>
  );
}


