import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { apiClient } from '@/lib/api'
import type { BilibiliAuthInitResponse, BilibiliAuthStatus } from '@/lib/types'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useIsMobile } from '@/hooks/use-mobile'

interface BilibiliAuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialStatus: BilibiliAuthStatus | null
  onStatusChange: (status: BilibiliAuthStatus | null) => void
  onControllerUnsupported: () => void
}

export function BilibiliAuthDialog({
  open,
  onOpenChange,
  initialStatus,
  onStatusChange,
  onControllerUnsupported,
}: BilibiliAuthDialogProps) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<BilibiliAuthStatus | null>(initialStatus)
  const [qrUrl, setQrUrl] = useState(initialStatus?.qr?.url ?? '')
  const [isStarting, setIsStarting] = useState(false)
  const isMobile = useIsMobile()

  const syncStatus = (next: BilibiliAuthStatus | BilibiliAuthInitResponse | null) => {
    if (!next) {
      setStatus(null)
      onStatusChange(null)
      return
    }

    const isFullStatus = 'state' in next
    const nextAccount = isFullStatus ? next.account ?? status?.account : status?.account
    const nextQrUrl = next.qr?.url ?? qrUrl
    if (next.qr?.url) {
      setQrUrl(next.qr.url)
    }

    const merged: BilibiliAuthStatus = {
      authenticated: isFullStatus ? next.authenticated : status?.authenticated ?? false,
      state: isFullStatus
        ? next.state
        : next.error
          ? 'failed'
          : nextQrUrl
            ? 'awaiting_qr'
            : status?.state ?? 'idle',
      lastError: isFullStatus ? next.lastError : next.error,
      ...(nextAccount ? { account: nextAccount } : {}),
      ...(nextQrUrl ? { qr: { url: nextQrUrl } } : {}),
    }

    setStatus(merged)
    onStatusChange(merged)
  }

  const qrImageUrl = qrUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(qrUrl)}`
    : ''
  const statusMessage = status?.state === 'qr_expired' ? '二维码已失效，请关闭窗口并重新点击登录' : status?.lastError
  const isUnsupportedStatus = (statusCode: number | undefined) => statusCode === 400 || statusCode === 404
  const startAuth = async () => {
    setIsStarting(true)
    try {
      const next = await apiClient.initBilibiliAuth()
      syncStatus(next)
    } catch (error: any) {
      if (isUnsupportedStatus(error?.response?.status)) {
        onControllerUnsupported()
        onOpenChange(false)
        return
      }

      const message = error?.response?.data?.error || error?.response?.data || error?.message || t('bilibiliAuth.startFailed')
      toast.error(message)
    } finally {
      setIsStarting(false)
    }
  }

  useEffect(() => {
    if (!open) {
      return
    }

    void startAuth()
  }, [open])

  useEffect(() => {
    setStatus(initialStatus)
    if (initialStatus?.qr?.url) {
      setQrUrl(initialStatus.qr.url)
    }
  }, [initialStatus])

  useEffect(() => {
    if (!open) {
      return
    }

    if (!status || !['awaiting_qr', 'authenticating'].includes(status.state)) {
      return
    }

    const timer = window.setInterval(() => {
      void apiClient.getBilibiliAuthStatus()
        .then((next) => {
          syncStatus(next)
          if (next.state == 'authenticated') {
            onOpenChange(false)
            toast.success(t('bilibiliAuth.loginSuccess'))
          }
        })
        .catch((error: any) => {
          if (isUnsupportedStatus(error?.response?.status)) {
            onControllerUnsupported()
            onOpenChange(false)
          }
        })
    }, 2000)

    return () => window.clearInterval(timer)
  }, [open, status?.state])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="py-6">
        <DialogHeader>
          <DialogTitle>{t('bilibiliAuth.title')}</DialogTitle>
          <DialogDescription>{t('bilibiliAuth.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {isStarting && (
            <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-muted-foreground">
              {t('bilibiliAuth.generatingQr')}
            </div>
          )}

          {!isStarting && statusMessage && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive text-sm text-center">
              {statusMessage}
            </div>
          )}

          {qrUrl && (
            <div className="flex justify-center">
              <a href={qrUrl} target="_blank" rel="noreferrer" className="inline-block">
                <img
                  src={qrImageUrl}
                  alt={t('bilibiliAuth.qrLink')}
                  referrerPolicy="no-referrer"
                  className="h-56 w-56 rounded-md border border-border bg-white object-contain p-2"
                  loading="lazy"
                />
              </a>
            </div>
          )}

          {qrUrl && isMobile && (
            <Button
              onClick={() => {
                if (qrUrl) {
                  window.open(qrUrl, '_blank')
                }
              }}
              className="w-full"
            >
              {t('bilibiliAuth.openScanLink')}
            </Button>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('roomConfig.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
