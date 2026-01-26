# Подключение к Render Backend Services

## 1. Необходимые сервисы на Render

Вам нужно развернуть следующие сервисы на Render:

### Main Backend API
- **Python/Django/FastAPI** сервис для основной логики приложения
- Должен включать эндпоинты: `/health`, `/upload`, `/stats`, `/user/{id}/uploads`

### DICOM Service
- Сервис для обработки DICOM файлов
- Эндпоинты: `/health`, `/dicom/{id}/info`, `/dicom/{id}/metadata`, `/dicom/{id}/frames`

## 2. Настройка переменных окружения

### В файле `.env.production`:
```env
# Замените на ваши реальные URL от Render
NEXT_PUBLIC_API_URL=https://your-backend-service.onrender.com
NEXT_PUBLIC_MICROSERVICE_URL=https://your-microservice.onrender.com
NEXT_PUBLIC_DICOM_SERVICE_URL=https://your-dicom-service.onrender.com
DATABASE_URL=postgresql://your-db-connection-string
AI_API_KEY=your-actual-ai-api-key
NEXT_PUBLIC_DEV_MODE=false
```

### В GitHub Secrets:
Добавьте следующие секреты в настройках репозитория GitHub:

1. `NEXT_PUBLIC_API_URL` - URL вашего основного API
2. `NEXT_PUBLIC_MICROSERVICE_URL` - URL микросервиса для обработки изображений
3. `NEXT_PUBLIC_DICOM_SERVICE_URL` - URL DICOM сервиса (можно тот же что и микросервис)
4. `AI_API_KEY` - API ключ для AI сервиса

## 3. Требуемые эндпоинты на бэкенде

### Main API endpoints:
```
GET  /health                    - проверка состояния
POST /upload                    - загрузка файла
GET  /upload/{id}               - детали загрузки
GET  /upload/{id}/preview       - превью изображения
GET  /upload/{id}/file          - полное изображение
GET  /stats                     - статистика
GET  /user/{id}/uploads         - список загрузок пользователя
DELETE /upload/{id}             - удаление загрузки
POST /upload/{id}/retry         - повторный анализ
```

### DICOM Service endpoints:
```
GET /health                     - проверка состояния
GET /dicom/{id}/info            - проверка является ли файл DICOM
GET /dicom/{id}/metadata        - метаданные DICOM файла
GET /dicom/{id}/frames          - кадры DICOM файла
GET /dicom/viewer/{id}          - DICOM viewer
```

## 4. Проверка подключения

После развертывания:
1. Обновите URL в `.env.production`
2. Зайдите на страницу Upload
3. Вверху страницы появится блок "Backend Services Status"
4. Зеленые индикаторы = сервисы подключены
5. Красные индикаторы = проблемы с подключением

## 5. Развертывание

1. Коммитьте изменения в main ветку
2. GitHub Actions автоматически соберет и развернет на GitHub Pages
3. Сайт будет доступен по адресу: `https://mmedcon.github.io/myometrics-frontend/`

## 6. Альтернативные варианты подключения

### Вариант A: Через GitHub Secrets (рекомендуется)
- Безопасно
- Автоматическая смена URL без пересборки

### Вариант B: Прямо в коде
- Замените URL в файле `lib/api/microservice.ts`
- Менее безопасно, но проще для тестирования

## 7. Отладка проблем

### Если сервисы не подключаются:
1. Проверьте CORS настройки на бэкенде
2. Убедитесь что эндпоинт `/health` доступен
3. Проверьте логи в Developer Tools браузера
4. Убедитесь что Render сервисы запущены и не "спят"

### Если статический экспорт не работает:
1. Временно используйте обычную сборку Next.js
2. Или замените динамические маршруты на статические
3. Рассмотрите развертывание на Vercel вместо GitHub Pages