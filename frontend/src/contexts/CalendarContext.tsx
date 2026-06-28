import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { CalendarEvent, ViewMode } from '../types';
import { getEvents } from '../api/events';
import { getMonthRange, getWeekRange, getDayRange } from '../utils/dateUtils';
import { useAuth } from './AuthContext';

interface CalendarContextType {
  currentDate: Date;
  viewMode: ViewMode;
  events: CalendarEvent[];
  selectedEvent: CalendarEvent | null;
  isLoading: boolean;
  showEventModal: boolean;
  modalMode: 'create' | 'edit';
  modalDefaultDate: Date | null;
  setCurrentDate: (date: Date) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedEvent: (event: CalendarEvent | null) => void;
  goToNext: () => void;
  goToPrev: () => void;
  goToToday: () => void;
  goToDate: (date: Date) => void;
  fetchEvents: () => Promise<void>;
  openCreateModal: (defaultDate?: Date) => void;
  openEditModal: (event: CalendarEvent) => void;
  closeModal: () => void;
  showPopover: CalendarEvent | null;
  popoverPosition: { x: number; y: number } | null;
  openPopover: (event: CalendarEvent, position: { x: number; y: number }) => void;
  closePopover: () => void;
}

const CalendarContext = createContext<CalendarContextType | null>(null);

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [modalDefaultDate, setModalDefaultDate] = useState<Date | null>(null);
  const [showPopover, setShowPopover] = useState<CalendarEvent | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      let range;
      switch (viewMode) {
        case 'month':
          range = getMonthRange(currentDate.getFullYear(), currentDate.getMonth());
          break;
        case 'week':
          range = getWeekRange(currentDate);
          break;
        case 'day':
          range = getDayRange(currentDate);
          break;
      }

      const data = await getEvents(range.start.toISOString(), range.end.toISOString());
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, viewMode, isAuthenticated]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const goToNext = useCallback(() => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      switch (viewMode) {
        case 'month':
          next.setMonth(next.getMonth() + 1);
          break;
        case 'week':
          next.setDate(next.getDate() + 7);
          break;
        case 'day':
          next.setDate(next.getDate() + 1);
          break;
      }
      return next;
    });
  }, [viewMode]);

  const goToPrev = useCallback(() => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      switch (viewMode) {
        case 'month':
          next.setMonth(next.getMonth() - 1);
          break;
        case 'week':
          next.setDate(next.getDate() - 7);
          break;
        case 'day':
          next.setDate(next.getDate() - 1);
          break;
      }
      return next;
    });
  }, [viewMode]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const goToDate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  const openCreateModal = useCallback((defaultDate?: Date) => {
    setSelectedEvent(null);
    setModalMode('create');
    setModalDefaultDate(defaultDate || new Date());
    setShowEventModal(true);
    setShowPopover(null);
  }, []);

  const openEditModal = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setModalMode('edit');
    setShowEventModal(true);
    setShowPopover(null);
  }, []);

  const closeModal = useCallback(() => {
    setShowEventModal(false);
    setSelectedEvent(null);
    setModalDefaultDate(null);
  }, []);

  const openPopover = useCallback((event: CalendarEvent, position: { x: number; y: number }) => {
    setShowPopover(event);
    setPopoverPosition(position);
  }, []);

  const closePopover = useCallback(() => {
    setShowPopover(null);
    setPopoverPosition(null);
  }, []);

  return (
    <CalendarContext.Provider
      value={{
        currentDate,
        viewMode,
        events,
        selectedEvent,
        isLoading,
        showEventModal,
        modalMode,
        modalDefaultDate,
        setCurrentDate,
        setViewMode,
        setSelectedEvent,
        goToNext,
        goToPrev,
        goToToday,
        goToDate,
        fetchEvents,
        openCreateModal,
        openEditModal,
        closeModal,
        showPopover,
        popoverPosition,
        openPopover,
        closePopover,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar(): CalendarContextType {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
}
