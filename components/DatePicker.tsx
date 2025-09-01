
import React, { useState, useEffect } from 'react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  onClose: () => void;
}

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}. ${month}. ${day}.`;
};

const parseDate = (dateStr: string): Date | null => {
    const parts = dateStr.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\./);
    if (parts) {
        const [, year, month, day] = parts.map(Number);
        // Date constructor handles month being 1-12 from user but needs 0-11
        const date = new Date(year, month - 1, day);
        // Check if the created date is valid and matches the input, accounting for invalid dates like Feb 30
        if (!isNaN(date.getTime()) && date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
            return date;
        }
    }
    return null;
};

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, onClose }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(parseDate(value));
  const [viewDate, setViewDate] = useState<Date>(parseDate(value) || new Date());
  
  useEffect(() => {
    const parsed = parseDate(value);
    setSelectedDate(parsed);
    if(parsed) {
        setViewDate(parsed);
    }
  }, [value]);

  const changeMonth = (amount: number) => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(1); // Avoids issues with different month lengths
      newDate.setMonth(newDate.getMonth() + amount);
      return newDate;
    });
  };

  const changeYear = (amount: number) => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      newDate.setFullYear(newDate.getFullYear() + amount);
      return newDate;
    });
  };

  const handleDateClick = (day: number) => {
    const newSelectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onChange(formatDate(newSelectedDate));
    onClose();
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="w-10 h-10"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDate &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === month &&
        selectedDate.getFullYear() === year;
      
      const isToday = new Date().getDate() === day &&
        new Date().getMonth() === month &&
        new Date().getFullYear() === year;

      const classes = [
        "w-10 h-10 flex items-center justify-center rounded-full cursor-pointer transition-colors",
        isSelected ? "bg-indigo-600 text-white font-bold" : "hover:bg-slate-200 dark:hover:bg-slate-600",
        isToday && !isSelected ? "border-2 border-indigo-500" : ""
      ].join(" ");
      
      days.push(
        <button key={day} type="button" className={classes} onClick={() => handleDateClick(day)} aria-label={`Select day ${day}`}>
          {day}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="absolute top-full mt-2 z-10 w-80 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg p-4 animate-fade-in-down" role="dialog" aria-label="Date selector">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => changeYear(-1)} className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Previous year">&laquo;</button>
        <button onClick={() => changeMonth(-1)} className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Previous month">&lsaquo;</button>
        <div className="font-bold text-center" aria-live="polite">
          {viewDate.getFullYear()}년 {viewDate.toLocaleString('ko-KR', { month: 'long' })}
        </div>
        <button onClick={() => changeMonth(1)} className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Next month">&rsaquo;</button>
        <button onClick={() => changeYear(1)} className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Next year">&raquo;</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm text-slate-500 dark:text-slate-400 mb-2" aria-hidden="true">
        <div>일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div>토</div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {renderCalendar()}
      </div>
    </div>
  );
};

export default DatePicker;
