# ZPassFit Web

Фронтенд-приложение для системы ZPassFit, предоставляющее интерфейс для пользователей и администраторов фитнес-центра.

## Технологии

-   **React Router**
-   **TypeScript**
-   **Bun** — среда выполнения и менеджер пакетов
-   **Tailwind CSS** — для стилизации
-   **TanStack Query** — для работы с данными
-   **Shadcn/UI** — компоненты интерфейса
-   **Playwright** — для E2E тестирования
-   **Biome** — для линтинга и форматирования

## Установка и запуск

### Настройка

1.  Установите зависимости:
    ```bash
    bun install
    ```

2.  Создайте файл `.env` на основе `.env.example`:
    ```bash
    cp .env.example .env
    ```
    Укажите `VITE_PUBLIC_API_BASE_URL`.

### Запуск

Запуск в режиме разработки:
```bash
bun dev
```
Приложение будет доступно по адресу `http://localhost:5173`.

## Дополнительные команды

-   `bun build` — сборка проекта для продакшена.
-   `bun check` — запуск Biome для проверки и исправления кода.
-   `bun api:gen` — генерация TypeScript типов на основе OpenAPI схемы (`openapi.yaml`).
-   `bun test:e2e` — запуск сквозных тестов Playwright.
-   `bun test:e2e:ui` — запуск интерфейса Playwright для отладки тестов.

## Использование Docker

Сборка образа:
```bash
make docker-build
```
или напрямую через Docker:
```bash
docker build -t zpassfit-web .
```
