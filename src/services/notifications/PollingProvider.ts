import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '../notifications.service';
import { authService } from '../auth.service';

/**
 * Polling Provider
 * 
 * Uses HTTP polling to fetch notifications at regular intervals.
 * Replaces WebSocket for simpler implementation while keeping
 * the interface similar for future upgrade.
 */
export function usePollingProvider() {
  const queryClient = useQueryClient();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Start polling
    startPolling();

    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentional: run only once on mount
  }, []);

  const startPolling = () => {
    if (pollingIntervalRef.current) return;

    // Poll every 30 seconds
    pollingIntervalRef.current = setInterval(() => {
      fetchNotifications();
    }, 30000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const fetchNotifications = async () => {
    if (!authService.isAuthenticated()) return;

    try {
      const response = await notificationsService.getAll();
      if (response.success && response.data) {
        // Update React Query cache
        queryClient.setQueryData(['notifications'], response.data);
      }
    } catch (error) {
      console.error('Polling failed', error);
    }
  };

  return {
    reconnect: () => {
      stopPolling();
      startPolling();
    },
  };
}
