(() => {
  const installButton = document.getElementById('install-button');
  const openButton = document.getElementById('open-button');
  const copyLinkButton = document.getElementById('copy-link-button');
  const installStatus = document.getElementById('install-status');
  const installHelp = document.getElementById('install-help');
  const installHint = document.getElementById('install-hint');

  let deferredInstallPrompt = null;

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;

  const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  const isAndroid = /android/i.test(window.navigator.userAgent);

  const setStatus = (title, help) => {
    if (!installStatus || !installHelp) {
      return;
    }

    installStatus.textContent = title;
    installHelp.textContent = help;
  };

  if (isStandalone) {
    setStatus(
      'Clickido jest już uruchomione jak aplikacja.',
      'Najwygodniej otwieraj je teraz z ikony na ekranie głównym.'
    );

    if (installHint) {
      installHint.textContent = 'Nie musisz już nic instalować. Możesz po prostu wejść do Clickido.';
    }
  } else if (isIos) {
    setStatus(
      'Na tym urządzeniu ikonę dodasz z menu przeglądarki.',
      'Po wejściu do Clickido wybierz opcję „Udostępnij”, a potem „Do ekranu głównego”.'
    );
  } else if (isAndroid) {
    setStatus(
      'Na Androidzie zwykle można dodać Clickido jak aplikację.',
      'Jeśli nie zobaczysz przycisku instalacji, otwórz menu przeglądarki i wybierz „Zainstaluj” albo „Dodaj do ekranu głównego”.'
    );
  } else {
    setStatus(
      'Najpierw otwórz Clickido i sprawdź opcje przeglądarki.',
      'Szukaj opcji „Zainstaluj”, „Dodaj do ekranu głównego” albo po prostu przypnij stronę jako skrót.'
    );
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;

    if (installButton) {
      installButton.hidden = false;
    }

    setStatus(
      'To urządzenie pozwala zainstalować Clickido.',
      'Możesz użyć przycisku poniżej i dodać aplikację do ekranu głównego.'
    );
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;

    if (installButton) {
      installButton.hidden = true;
    }

    setStatus(
      'Clickido zostało dodane do urządzenia.',
      'Szukaj teraz ikony Clickido na ekranie głównym i uruchamiaj aplikację stamtąd.'
    );

    if (installHint) {
      installHint.textContent = 'Jeśli ikona już jest widoczna, kolejne wejścia rób właśnie przez nią.';
    }
  });

  installButton?.addEventListener('click', async () => {
    if (!deferredInstallPrompt) {
      return;
    }

    deferredInstallPrompt.prompt();
    const result = await deferredInstallPrompt.userChoice;

    if (result.outcome === 'accepted') {
      setStatus(
        'Instalacja została zaakceptowana.',
        'Po chwili urządzenie powinno dodać ikonę Clickido.'
      );
    } else {
      setStatus(
        'Instalacja została pominięta.',
        'Możesz wrócić do niej później przez menu przeglądarki.'
      );
    }
  });

  copyLinkButton?.addEventListener('click', async () => {
    const appUrl = `${window.location.origin}/app/`;

    try {
      await navigator.clipboard.writeText(appUrl);
      copyLinkButton.textContent = 'Link skopiowany';

      window.setTimeout(() => {
        copyLinkButton.textContent = 'Skopiuj link do aplikacji';
      }, 1800);
    } catch {
      window.location.href = appUrl;
    }
  });

  openButton?.addEventListener('click', () => {
    if (!isStandalone) {
      window.sessionStorage.setItem('clickido-start-page-visited', '1');
    }
  });
})();
