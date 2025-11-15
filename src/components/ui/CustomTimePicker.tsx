'use client';

import { useState, useRef, useEffect } from 'react';
import { Icons } from '@/components/ui/Icons';
import { useTranslation } from '@/hooks/useTranslation';

interface CustomTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export default function CustomTimePicker({ value, onChange, className = '', placeholder }: CustomTimePickerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState('00');
  const [minutes, setMinutes] = useState('00');
  const containerRef = useRef<HTMLDivElement>(null);
  const hoursContainerRef = useRef<HTMLDivElement>(null);
  const minutesContainerRef = useRef<HTMLDivElement>(null);

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Парсинг значения при изменении
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      if (h && m) {
        setHours(h.padStart(2, '0'));
        setMinutes(m.padStart(2, '0'));
      }
    } else {
      setHours('00');
      setMinutes('00');
    }
  }, [value]);

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    return timeStr;
  };

  const handleTimeChange = (newHours: string, newMinutes: string) => {
    const timeString = `${newHours.padStart(2, '0')}:${newMinutes.padStart(2, '0')}`;
    onChange(timeString);
  };

  const handleHourChange = (newHours: string) => {
    setHours(newHours);
    handleTimeChange(newHours, minutes);
    // Не закрываем меню, чтобы можно было выбрать и минуты
  };

  const handleMinuteChange = (newMinutes: string) => {
    setMinutes(newMinutes);
    handleTimeChange(hours, newMinutes);
    // Закрываем меню после выбора минут
    setTimeout(() => setIsOpen(false), 200);
  };

  const clearTime = () => {
    onChange('');
    setIsOpen(false);
  };

  // Автоматическая прокрутка к выбранному времени при открытии
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        // Прокрутка к выбранному часу
        if (hoursContainerRef.current) {
          const selectedHourButton = hoursContainerRef.current.querySelector(`button:nth-child(${parseInt(hours) + 1})`);
          if (selectedHourButton) {
            selectedHourButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        
        // Прокрутка к выбранной минуте
        if (minutesContainerRef.current) {
          const selectedMinuteButton = minutesContainerRef.current.querySelector(`button:nth-child(${parseInt(minutes) + 1})`);
          if (selectedMinuteButton) {
            selectedMinuteButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 100);
    }
  }, [isOpen, hours, minutes]);

  const setCurrentTime = () => {
    const now = new Date();
    const currentHours = now.getHours().toString().padStart(2, '0');
    const currentMinutes = now.getMinutes().toString().padStart(2, '0');
    setHours(currentHours);
    setMinutes(currentMinutes);
    handleTimeChange(currentHours, currentMinutes);
    setIsOpen(false);
  };

  // Генерация опций для часов и минут
  const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {/* Input field */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 bg-[#242424] border-0 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all cursor-pointer flex items-center justify-between w-full"
      >
        <span className={value ? 'text-white' : 'text-gray-400'}>
          {value ? formatTime(value) : (placeholder || t('timePicker.time'))}
        </span>
        <Icons.Clock className="h-4 w-4 text-gray-400" />
      </div>

      {/* Time picker dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#151515] border border-gray-700/50 rounded-xl shadow-2xl z-[100] p-4 min-w-[200px]">
          {/* Header */}
          <div className="text-white font-medium mb-4 text-center">
            {t('timePicker.selectTime')}
          </div>

          {/* Time selectors */}
          <div className="flex items-center gap-2 mb-4">
            {/* Hours */}
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-2">{t('timePicker.hours')}</label>
              <div ref={hoursContainerRef} className="bg-[#242424] rounded-lg max-h-32 overflow-y-auto border border-gray-700/50">
                {hourOptions.map(hour => (
                  <button
                    key={hour}
                    onClick={() => handleHourChange(hour)}
                    className={`w-full px-2 py-1 text-sm text-left hover:bg-[#363636] transition-all ${
                      hours === hour ? 'bg-blue-500 text-white' : 'text-gray-300'
                    }`}
                  >
                    {hour}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-white text-lg font-bold mt-6">:</div>
            {/* Minutes */}
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-2">{t('timePicker.minutes')}</label>
              <div ref={minutesContainerRef} className="bg-[#242424] rounded-lg max-h-32 overflow-y-auto border border-gray-700/50">
                {minuteOptions.map(minute => (
                  <button
                    key={minute}
                    onClick={() => handleMinuteChange(minute)}
                    className={`w-full px-2 py-1 text-sm text-left hover:bg-[#363636] transition-all ${
                      minutes === minute ? 'bg-blue-500 text-white' : 'text-gray-300'
                    }`}
                  >
                    {minute}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick time buttons */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => {
                setHours('00');
                setMinutes('00');
                handleTimeChange('00', '00');
                setTimeout(() => setIsOpen(false), 200);
              }}
              className="px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#242424] rounded-lg transition-all"
            >
              00:00
            </button>
            <button
              onClick={() => {
                setHours('23');
                setMinutes('59');
                handleTimeChange('23', '59');
                setTimeout(() => setIsOpen(false), 200);
              }}
              className="px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#242424] rounded-lg transition-all"
            >
              23:59
            </button>
          </div>

          {/* Footer buttons */}
          <div className="flex gap-2 pt-2 border-t border-gray-700/50">
            <button
              onClick={setCurrentTime}
              className="flex-1 px-3 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-xl transition-all"
            >
              {t('timePicker.now')}
            </button>
            <button
              onClick={clearTime}
              className="flex-1 px-3 py-2 text-sm text-gray-400 hover:text-gray-300 hover:bg-gray-500/10 rounded-xl transition-all"
            >
              {t('timePicker.clear')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

