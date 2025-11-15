'use client';

import { useState, useRef, useEffect } from 'react';
import { Icons } from '@/components/ui/Icons';
import { useTranslation } from '@/hooks/useTranslation';

interface CustomDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export default function CustomDatePicker({ value, onChange, className = '', placeholder }: CustomDatePickerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [day, setDay] = useState('01');
  const [month, setMonth] = useState('01');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dayContainerRef = useRef<HTMLDivElement>(null);
  const monthContainerRef = useRef<HTMLDivElement>(null);
  const yearContainerRef = useRef<HTMLDivElement>(null);

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
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setDay(date.getDate().toString().padStart(2, '0'));
        setMonth((date.getMonth() + 1).toString().padStart(2, '0'));
        setYear(date.getFullYear().toString());
      }
    } else {
      const today = new Date();
      setDay(today.getDate().toString().padStart(2, '0'));
      setMonth((today.getMonth() + 1).toString().padStart(2, '0'));
      setYear(today.getFullYear().toString());
    }
  }, [value]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleDateChange = (newDay: string, newMonth: string, newYear: string) => {
    // Проверка валидности даты
    const daysInMonth = new Date(parseInt(newYear), parseInt(newMonth), 0).getDate();
    const validDay = Math.min(parseInt(newDay), daysInMonth).toString().padStart(2, '0');
    
    const dateString = `${newYear}-${newMonth.padStart(2, '0')}-${validDay.padStart(2, '0')}`;
    onChange(dateString);
  };

  const handleDayChange = (newDay: string) => {
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    const validDay = Math.min(parseInt(newDay), daysInMonth).toString().padStart(2, '0');
    setDay(validDay);
    handleDateChange(validDay, month, year);
    // Закрываем меню после выбора дня
    setTimeout(() => setIsOpen(false), 200);
  };

  const handleMonthChange = (newMonth: string) => {
    setMonth(newMonth);
    // Проверяем, что день не превышает количество дней в новом месяце
    const daysInMonth = new Date(parseInt(year), parseInt(newMonth), 0).getDate();
    const validDay = Math.min(parseInt(day), daysInMonth).toString().padStart(2, '0');
    setDay(validDay);
    handleDateChange(validDay, newMonth, year);
    // Не закрываем меню, чтобы можно было выбрать день и год
  };

  const handleYearChange = (newYear: string) => {
    setYear(newYear);
    // Проверяем високосный год для 29 февраля
    const daysInMonth = new Date(parseInt(newYear), parseInt(month), 0).getDate();
    const validDay = Math.min(parseInt(day), daysInMonth).toString().padStart(2, '0');
    setDay(validDay);
    handleDateChange(validDay, month, newYear);
    // Не закрываем меню, чтобы можно было выбрать день и месяц
  };

  const clearDate = () => {
    onChange('');
    setIsOpen(false);
  };

  // Автоматическая прокрутка к выбранной дате при открытии
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        // Прокрутка к выбранному дню
        if (dayContainerRef.current) {
          const selectedDayButton = dayContainerRef.current.querySelector(`button:nth-child(${parseInt(day)})`);
          if (selectedDayButton) {
            selectedDayButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        
        // Прокрутка к выбранному месяцу
        if (monthContainerRef.current) {
          const selectedMonthButton = monthContainerRef.current.querySelector(`button:nth-child(${parseInt(month)})`);
          if (selectedMonthButton) {
            selectedMonthButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        
        // Прокрутка к выбранному году
        if (yearContainerRef.current) {
          const currentYear = parseInt(year);
          const startYear = currentYear - 10;
          const yearIndex = currentYear - startYear + 1;
          const selectedYearButton = yearContainerRef.current.querySelector(`button:nth-child(${yearIndex})`);
          if (selectedYearButton) {
            selectedYearButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 100);
    }
  }, [isOpen, day, month, year]);

  const setCurrentDate = () => {
    const now = new Date();
    const currentDay = now.getDate().toString().padStart(2, '0');
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    const currentYear = now.getFullYear().toString();
    setDay(currentDay);
    setMonth(currentMonth);
    setYear(currentYear);
    handleDateChange(currentDay, currentMonth, currentYear);
    setIsOpen(false);
  };

  // Генерация опций
  // Вычисляем количество дней в выбранном месяце
  const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
  const dayOptions = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const monthOptions = [
    { value: '01', label: t('datePicker.january') },
    { value: '02', label: t('datePicker.february') },
    { value: '03', label: t('datePicker.march') },
    { value: '04', label: t('datePicker.april') },
    { value: '05', label: t('datePicker.may') },
    { value: '06', label: t('datePicker.june') },
    { value: '07', label: t('datePicker.july') },
    { value: '08', label: t('datePicker.august') },
    { value: '09', label: t('datePicker.september') },
    { value: '10', label: t('datePicker.october') },
    { value: '11', label: t('datePicker.november') },
    { value: '12', label: t('datePicker.december') },
  ];
  
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 50 }, (_, i) => (currentYear - 10 + i).toString());

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {/* Input field */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 bg-[#242424] border-0 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all cursor-pointer flex items-center justify-between w-full"
      >
        <span className={value ? 'text-white' : 'text-gray-400'}>
          {value ? formatDate(value) : (placeholder || t('datePicker.date'))}
        </span>
        <Icons.Calendar className="h-4 w-4 text-gray-400" />
      </div>

      {/* Date picker dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#151515] border border-gray-700/50 rounded-xl shadow-2xl z-[100] p-4 min-w-[300px]">
          {/* Header */}
          <div className="text-white font-medium mb-4 text-center">
            {t('datePicker.selectDate')}
          </div>

          {/* Date selectors */}
          <div className="flex items-center gap-2 mb-4">
            {/* Day */}
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-2">{t('datePicker.day')}</label>
              <div ref={dayContainerRef} className="bg-[#242424] rounded-lg max-h-32 overflow-y-auto border border-gray-700/50">
                {dayOptions.map(d => (
                  <button
                    key={d}
                    onClick={() => handleDayChange(d)}
                    className={`w-full px-2 py-1 text-sm text-left hover:bg-[#363636] transition-all ${
                      day === d ? 'bg-blue-500 text-white' : 'text-gray-300'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Month */}
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-2">{t('datePicker.month')}</label>
              <div ref={monthContainerRef} className="bg-[#242424] rounded-lg max-h-32 overflow-y-auto border border-gray-700/50">
                {monthOptions.map(m => (
                  <button
                    key={m.value}
                    onClick={() => handleMonthChange(m.value)}
                    className={`w-full px-2 py-1 text-sm text-left hover:bg-[#363636] transition-all ${
                      month === m.value ? 'bg-blue-500 text-white' : 'text-gray-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Year */}
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-2">{t('datePicker.year')}</label>
              <div ref={yearContainerRef} className="bg-[#242424] rounded-lg max-h-32 overflow-y-auto border border-gray-700/50">
                {yearOptions.map(y => (
                  <button
                    key={y}
                    onClick={() => handleYearChange(y)}
                    className={`w-full px-2 py-1 text-sm text-left hover:bg-[#363636] transition-all ${
                      year === y ? 'bg-blue-500 text-white' : 'text-gray-300'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick date buttons */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => {
                const today = new Date();
                const todayDay = today.getDate().toString().padStart(2, '0');
                const todayMonth = (today.getMonth() + 1).toString().padStart(2, '0');
                const todayYear = today.getFullYear().toString();
                setDay(todayDay);
                setMonth(todayMonth);
                setYear(todayYear);
                handleDateChange(todayDay, todayMonth, todayYear);
                setTimeout(() => setIsOpen(false), 200);
              }}
              className="px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#242424] rounded-lg transition-all"
            >
              {t('datePicker.today')}
            </button>
            <button
              onClick={() => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayDay = yesterday.getDate().toString().padStart(2, '0');
                const yesterdayMonth = (yesterday.getMonth() + 1).toString().padStart(2, '0');
                const yesterdayYear = yesterday.getFullYear().toString();
                setDay(yesterdayDay);
                setMonth(yesterdayMonth);
                setYear(yesterdayYear);
                handleDateChange(yesterdayDay, yesterdayMonth, yesterdayYear);
                setTimeout(() => setIsOpen(false), 200);
              }}
              className="px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#242424] rounded-lg transition-all"
            >
              {t('datePicker.yesterday')}
            </button>
          </div>

          {/* Footer buttons */}
          <div className="flex gap-2 pt-2 border-t border-gray-700/50">
            <button
              onClick={setCurrentDate}
              className="flex-1 px-3 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-xl transition-all"
            >
              {t('datePicker.now')}
            </button>
            <button
              onClick={clearDate}
              className="flex-1 px-3 py-2 text-sm text-gray-400 hover:text-gray-300 hover:bg-gray-500/10 rounded-xl transition-all"
            >
              {t('datePicker.clear')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

