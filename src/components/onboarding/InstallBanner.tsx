import { useEffect, useMemo, useState } from 'react';
import { getItem, setItem, STORAGE_KEYS } from '@services/storageService';
import { useSettingsStore } from '@store/settingsStore';
import styles from './InstallBanner.module.css';

type BannerState = 'hidden' | 'installable' | 'ios' | 'android' | 'browser' | 'standalone';

type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function InstallBanner() {
  const { display } = useSettingsStore();
  const [bannerState, setBannerState] = useState<BannerState>('hidden');
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<DeferredInstallPrompt | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const onboardingComplete = getItem(STORAGE_KEYS.ONBOARDING_COMPLETE, false);
    const dismissedBanner = getItem(STORAGE_KEYS.INSTALL_BANNER_DISMISSED, false);
    const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || navigatorWithStandalone.standalone === true;

    if (!onboardingComplete || dismissedBanner) {
      setDismissed(true);
      return;
    }

    if (isStandalone) {
      setBannerState('standalone');
      setDismissed(true);
      return;
    }

    setDismissed(false);

    const userAgent = window.navigator.userAgent.toLowerCase();

    if (/iphone|ipad|ipod/.test(userAgent)) {
      setBannerState('ios');
    } else if (/android/.test(userAgent)) {
      setBannerState('android');
    } else {
      setBannerState('browser');
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event as DeferredInstallPrompt);
      setBannerState('installable');
    };

    const handleAppInstalled = () => {
      setItem(STORAGE_KEYS.INSTALL_BANNER_DISMISSED, true);
      setDismissed(true);
      setDeferredInstallPrompt(null);
      setBannerState('standalone');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const content = useMemo(() => {
    switch (bannerState) {
      case 'installable':
        return {
          emoji: '📥',
          title: 'Dodaj Clickido do ekranu głównego',
          description: 'Będzie otwierać się czyściej i bardziej jak osobna aplikacja.',
          actionLabel: 'Zainstaluj',
        };
      case 'ios':
        return {
          emoji: '📱',
          title: 'Dodaj ikonę z menu przeglądarki',
          description: 'Na iPhonie lub iPadzie użyj „Udostępnij” → „Do ekranu głównego”.',
          actionLabel: 'Rozumiem',
        };
      case 'android':
        return {
          emoji: '📲',
          title: 'Najlepiej uruchamiać Clickido z ikony',
          description: 'Jeśli nie widzisz instalacji, użyj w menu przeglądarki opcji „Dodaj do ekranu głównego”.',
          actionLabel: 'Jasne',
        };
      case 'browser':
      default:
        return {
          emoji: '💡',
          title: 'Na tablecie warto przypiąć Clickido jako skrót',
          description: 'To nie jest konieczne, ale bardzo poprawia wygodę codziennego używania.',
          actionLabel: 'OK',
        };
    }
  }, [bannerState]);

  const closeBanner = () => {
    setItem(STORAGE_KEYS.INSTALL_BANNER_DISMISSED, true);
    setDismissed(true);
  };

  const handlePrimaryAction = async () => {
    if (bannerState === 'installable' && deferredInstallPrompt) {
      await deferredInstallPrompt.prompt();
      const result = await deferredInstallPrompt.userChoice;

      if (result.outcome === 'accepted') {
        setItem(STORAGE_KEYS.INSTALL_BANNER_DISMISSED, true);
        setDismissed(true);
        setBannerState('standalone');
        return;
      }
    }

    closeBanner();
  };

  if (display.kidsMode || dismissed || bannerState === 'hidden' || bannerState === 'standalone') {
    return null;
  }

  return (
    <section className={styles.banner} aria-label="Wskazówka instalacji aplikacji">
      <div className={styles.content}>
        <span className={styles.emoji} aria-hidden="true">
          {content.emoji}
        </span>
        <div className={styles.text}>
          <strong>{content.title}</strong>
          <span>{content.description}</span>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.secondaryButton} onClick={closeBanner}>
          Później
        </button>
        <button type="button" className={styles.primaryButton} onClick={handlePrimaryAction}>
          {content.actionLabel}
        </button>
      </div>
    </section>
  );
}
