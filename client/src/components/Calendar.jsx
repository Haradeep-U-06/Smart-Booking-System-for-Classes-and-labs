import React, { useState, useEffect } from 'react';
import './Calendar.css';

function Calendar({ onSelectDate, onClose, currentSelectedDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(
    currentSelectedDate ? new Date(currentSelectedDate) : new Date()
  );

  // Get days in month for the calendar grid
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get day of week for first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  // Format date as YYYY-MM-DD for API calls
  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Handle date selection
  const handleDateClick = (day) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
    
    // Format date and pass to parent component
    const formattedDate = formatDateForAPI(newDate);
    onSelectDate(formattedDate);
    onClose();
  };

  // Check if a date is selectable (within allowed range)
  const isDateSelectable = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Allow selection of today and future dates (within next 60 days)
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 60);
    
    return date >= today && date <= maxDate;
  };

  // Check if a day is the currently selected date
  const isSelectedDate = (day) => {
    return (
      selectedDate &&
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  // Check if a day is today
  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  // Render calendar grid
  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(
      currentMonth.getFullYear(),
      currentMonth.getMonth()
    );
    const firstDayOfMonth = getFirstDayOfMonth(
      currentMonth.getFullYear(),
      currentMonth.getMonth()
    );

    // Create blank cells for days before the first day of month
    const blanks = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      blanks.push(
        <div key={`blank-${i}`} className="calendar-day empty"></div>
      );
    }

    // Create cells for all days in the month
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const selectable = isDateSelectable(d);
      const selected = isSelectedDate(d);
      const today = isToday(d);
      
      days.push(
        <div
          key={`day-${d}`}
          className={`calendar-day ${!selectable ? 'disabled' : ''} ${selected ? 'selected' : ''} ${today ? 'today' : ''}`}
          onClick={() => selectable && handleDateClick(d)}
        >
          {d}
        </div>
      );
    }

    return [...blanks, ...days];
  };

  // Get month and year for header
  const monthYearString = () => {
    return currentMonth.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.classList.contains('calendar-modal-backdrop')) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="calendar-modal-backdrop">
      <div className="calendar-container">
        <div className="calendar-header">
          <button className="month-nav" onClick={prevMonth}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
            </svg>
          </button>
          <h3>{monthYearString()}</h3>
          <button className="month-nav" onClick={nextMonth}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
            </svg>
          </button>
        </div>
        
        <div className="calendar-weekdays">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>
        
        <div className="calendar-days">{renderCalendarDays()}</div>
        
        <div className="calendar-footer">
          <button className="btn-today" onClick={() => handleDateClick(new Date().getDate())}>
            Today
          </button>
          <button className="btn-close" onClick={onClose}>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Calendar;