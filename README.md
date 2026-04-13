# Clickido

Clickido to polska aplikacja PWA do zarządzania domowymi obowiązkami, projektowana przede wszystkim pod tablet wiszący w kuchni lub innym centralnym miejscu domu.

Aktualny stan repo to działający rdzeń MVP:

- React + TypeScript + Vite
- Zustand do zarządzania stanem
- lokalne dane w `localStorage`
- podstawowy daily flow zadań
- modal tworzenia i edycji zadań
- eksport i import backupu JSON
- podstawowa konfiguracja PWA i ikon

## Status

Projekt jest w trakcie etapowego domykania MVP. Repo:

- buduje się poprawnie przez `npm run build`
- przechodzi `npm audit` bez podatności
- nie jest jeszcze gotowe do produkcyjnego wdrożenia

Najbardziej aktualny obraz stanu prac znajduje się w:

- [`_docs/report-weryfikacja-stanu-wdrozenia-2026-04-11.md`](_docs/report-weryfikacja-stanu-wdrozenia-2026-04-11.md)

## Stack

- React 18
- TypeScript
- Vite 6
- React Router
- Zustand
- vite-plugin-pwa
- framer-motion
- date-fns

## Uruchomienie lokalne

Instalacja zależności:

```bash
npm install
```

Tryb developerski:

```bash
npm run dev
```

Aplikacja działa pod ścieżką bazową:

```text
/app/
```

Typowy lokalny adres po starcie Vite:

```text
http://localhost:3000/app/
```

Jeśli Vite wybierze inny port, zachowaj końcówkę `/app/`.

Podgląd buildu produkcyjnego:

```bash
npm run build
npm run preview
```

## Skrypty

- `npm run dev` — lokalny serwer developerski
- `npm run build` — build produkcyjny
- `npm run preview` — lokalny preview buildu
- `npm run lint` — lint
- `npm run watch` — pomocniczy watch script
- `npm run minify:css` — pomocnicza minifikacja CSS
- `npm run minify:js` — pomocnicza minifikacja JS
- `npm run optimize:images` — optymalizacja obrazów
- `npm run optimize:video` — optymalizacja wideo

## Struktura repo

- `src/` — aplikacja React
- `src/components/` — komponenty UI, layout, task flow, screensaver
- `src/pages/` — główne ekrany aplikacji
- `src/store/` — store’y Zustand
- `src/services/` — storage i logika domenowa
- `src/assets/` — bundlowane assety aplikacji
- `public/` — pliki publiczne, fonty, ikony, pliki deployowe
- `landing/` — osobny landing projektu
- `_docs/` — dokumentacja produktowa, techniczna i raporty operacyjne
- `_scripts/` — skrypty pomocnicze

## Zakres MVP w repo

Na obecnym etapie działają lub są rozpoczęte:

- widok dnia (`TodayPage`)
- baza zadań (`TasksPage`)
- panel ustawień (`SettingsPage`)
- screensaver w wersji minimalnej
- task flow oparty o wspólny modal `TaskForm`
- zapis danych lokalnie i backup JSON

Nadal otwarte są między innymi:

- finalne domknięcie UX i spójności całego flow dziennego
- dalsza stabilizacja responsywności i geometrii dolnej strefy UI
- pełny zestaw assetów marketingowych i social
- finalne materiały launchowe i produkcyjne wdrożenie

## Ważne operacyjnie

- Nie używaj `npm audit fix --force` bez analizy skutków dla toolchainu.
- Repo ma bazę `/app/`, więc testy lokalne i preview trzeba otwierać pod `/app/`.
- Bieżący plan pracy jest prowadzony etapowo i aktualizowany w raporcie operacyjnym.

## Dokumentacja

Najważniejsze pliki w `_docs/`:

- `01-KONCEPT.md` — wizja produktu
- `02-ARCHITEKTURA.md` — architektura docelowa
- `03-FUNKCJONALNOSCI.md` — funkcje produktu
- `04-DESIGN-SYSTEM.md` — założenia wizualne
- `07-TESTOWANIE.md` — checklisty testowe
- `08-INFRASTRUKTURA.md` — założenia wdrożeniowe
- `11-ASSETS-CHECKLIST.md` — checklist assetów
- `report-weryfikacja-stanu-wdrozenia-2026-04-11.md` — aktualny raport operacyjny

## Autorstwo

- Koncepcja produktu i dokumentacja źródłowa: DominDev
- Prace implementacyjne i raportowanie w tym repo: Codex / OpenAI + DominDev
