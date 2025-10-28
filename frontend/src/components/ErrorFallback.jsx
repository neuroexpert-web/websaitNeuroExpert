import { Button } from './ui/button';

const supportEmail = process.env.REACT_APP_SUPPORT_EMAIL || 'hi@neuroexpert.ai';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0f17] text-white px-6 text-center">
      <div className="max-w-xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Что-то пошло не так</h1>
          <p className="text-white/70">
            Мы уже получили уведомление и занимаемся устранением ошибки. Попробуйте обновить страницу или свяжитесь с нами напрямую.
          </p>
        </div>

        <div className="bg-white/10 border border-white/10 rounded-2xl px-6 py-5 text-left space-y-3">
          <p className="text-sm text-white/80">
            <span className="font-semibold">Техническая информация:</span>{' '}
            {error?.message || 'Неизвестная ошибка'}
          </p>
          <p className="text-xs text-white/50">
            Если ошибка повторяется, напишите нам на{' '}
            <a href={`mailto:${supportEmail}`} className="text-cyan-300 hover:text-cyan-200 underline">
              {supportEmail}
            </a>{' '}
            с описанием действий.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => resetErrorBoundary?.()}
            className="bg-gradient-to-r from-[#7dd3fc] to-[#764ba2] text-white px-6 py-2 rounded-xl"
          >
            Попробовать снова
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Обновить страницу
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ErrorFallback;
