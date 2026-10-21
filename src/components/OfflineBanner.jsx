import { useState, useEffect } from "react";
import styles from "./OfflineBanner.module.css";

/**
 * Displays a top banner when the browser is offline.
 * Disappears when connectivity is restored.
 */
export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online",  goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className={styles.banner} role="alert">
      <span>📶</span>
      <span>You are offline — Crop Doctor AI continues to work using the cached model.</span>
    </div>
  );
}
