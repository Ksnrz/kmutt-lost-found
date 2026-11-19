import { useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest } from '../api';

export default function useClaimNotifications() {
  const [notifications, setNotifications] = useState(null);
  const [notificationError, setNotificationError] = useState('');
  const notificationRequest = useRef(null);
  const token = localStorage.getItem('token');
  const unreadCount = token ? notifications?.filter((entry) => !entry.read_at).length ?? 0 : 0;

  const loadNotifications = useCallback(() => {
    if (!token) return;
    notificationRequest.current?.abort();
    const controller = new AbortController();
    notificationRequest.current = controller;
    return apiRequest('/claim-notifications', { signal: controller.signal }).then((data) => {
      if (controller.signal.aborted) return;
      setNotifications(data.notifications);
      setNotificationError('');
    }).catch((error) => {
      if (!controller.signal.aborted && error.status !== 401) {
        setNotificationError('ไม่สามารถโหลดการแจ้งเตือนได้');
      }
    });
  }, [token]);

  useEffect(() => {
    if (!token) return;
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 15000);
    window.addEventListener('focus', loadNotifications);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', loadNotifications);
      notificationRequest.current?.abort();
    };
  }, [token, loadNotifications]);

  const markClaimRead = useCallback(async (verifyId) => {
    if (!token) return;
    const { notifications: updated } = await apiRequest(
      `/verify/${verifyId}/notifications/read`,
      { method: 'PATCH' }
    );
    notificationRequest.current?.abort();
    const readTimes = new Map(updated.map((item) => [item.notification_id, item.read_at]));
    setNotifications((items) => items?.map((item) =>
      readTimes.has(item.notification_id) ? { ...item, read_at: readTimes.get(item.notification_id) } : item
    ) ?? null);
    loadNotifications();
  }, [token, loadNotifications]);

  return { token, notifications, unreadCount, notificationError, loadNotifications, markClaimRead };
}
