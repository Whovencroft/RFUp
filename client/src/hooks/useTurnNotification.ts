import { useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Fires a browser notification and updates the tab title when it becomes
 * the current player's turn in an AI session.
 *
 * @param isMyTurn   Whether it is currently this player's turn
 * @param sessionTitle  The session title to include in the notification
 */
export function useTurnNotification(isMyTurn: boolean, sessionTitle: string) {
  const prevIsMyTurn = useRef(false);
  const originalTitle = useRef(document.title);

  // Request notification permission once on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    // Restore title on unmount
    return () => {
      document.title = originalTitle.current;
    };
  }, []);

  useEffect(() => {
    // Only fire when transitioning from not-my-turn → my-turn
    if (isMyTurn && !prevIsMyTurn.current) {
      // Update tab title
      document.title = `⚡ YOUR TURN — ${sessionTitle}`;
      // In-app toast
      toast("⚡ It's your turn!", {
        description: sessionTitle,
        duration: 5000,
      });

      // Fire browser notification if permitted and page is not focused
      if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
        try {
          new Notification("Roll for Uptime — Your Turn", {
            body: `It's your turn in: ${sessionTitle}`,
            icon: "/favicon.ico",
            tag: "rfu-turn",
            requireInteraction: false,
          });
        } catch {
          // Notification API may not be available in all contexts; fail silently
        }
      }
    } else if (!isMyTurn && prevIsMyTurn.current) {
      // Restore tab title when turn passes
      document.title = originalTitle.current;
    }

    prevIsMyTurn.current = isMyTurn;
  }, [isMyTurn, sessionTitle]);
}
