'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

export function WelcomeToast() {
  useEffect(() => {
    // ignore if screen height is too small
    if (window.innerHeight < 650) return;
    if (!document.cookie.includes('welcome-toast=2')) {
      toast('🛍️ Welcome to Tarazoo!', {
        id: 'welcome-toast',
        duration: 8000,
        onDismiss: () => {
          document.cookie = 'welcome-toast=2; max-age=31536000; path=/';
        },
        description: (
          <>
            A streamlined storefront with camera-powered cart and Supabase orders.
          </>
        )
      });
    }
  }, []);

  return null;
}
