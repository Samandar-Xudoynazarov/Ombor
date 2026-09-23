'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, Share2 } from 'lucide-react';
import { Sheet, Spinner, useToast } from './ui';
import { useT } from '@/lib/i18n';
import { buildXlsx, XLSX_MIME } from '@/lib/xlsx';
import { canShareFiles, downloadFile, shareFile } from '@/lib/save';

/**
 * Excel eksport tugmasi.
 * build: async () => ({ filename, sheets })  — sheets xlsx.js formatida
 */
export default function ExportButton({ build, title, className = 'icon-btn', children, ariaLabel }) {
  const t = useT();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState(null); // { name, data, rows }

  async function prepare() {
    setOpen(true);
    setBusy(true);
    setFile(null);
    try {
      const { filename, sheets, rowCount } = await build();
      const data = buildXlsx(sheets);
      setFile({ name: filename, data, rows: rowCount });
    } catch (e) {
      toast(e.message || t('Xatolik yuz berdi'), 'error');
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  function onDownload() {
    downloadFile(file.name, file.data);
    toast(t('Fayl yuklab olindi'));
    setOpen(false);
  }

  async function onShare() {
    try {
      await shareFile(file.name, file.data, XLSX_MIME, title);
      setOpen(false);
    } catch (e) {
      if (e?.name === 'AbortError') return;
      toast(t('Ulashib bo\'lmadi, faylni yuklab oling'), 'error');
    }
  }

  const shareOk = file ? canShareFiles(file.name, file.data) : false;

  return (
    <>
      <button className={className} onClick={prepare} aria-label={ariaLabel || t('Excelga yuklash')}>
        {children || <Download />}
      </button>

      <Sheet open={open} onClose={() => !busy && setOpen(false)} title={t('Excel fayl')}>
        {busy || !file ? (
          <div className="row" style={{ justifyContent: 'center', padding: '28px 0', color: 'var(--primary)' }}>
            <Spinner />
            <span className="muted">{t('Fayl tayyorlanmoqda…')}</span>
          </div>
        ) : (
          <div className="stack">
            <div className="card card-pad row">
              <div className="avatar" style={{ background: 'var(--in-soft)', color: 'var(--in)' }}>
                <FileSpreadsheet />
              </div>
              <div className="grow">
                <div className="bold ellipsis">{file.name}</div>
                <div className="small muted">
                  {file.rows != null ? t('{n} ta qator', { n: file.rows }) : t('Excel jadval')} ·{' '}
                  {Math.max(1, Math.round(file.data.length / 1024))} KB
                </div>
              </div>
            </div>

            {shareOk && (
              <button className="btn btn-primary btn-block" onClick={onShare}>
                <Share2 /> {t('Ulashish (Telegram, pochta…)')}
              </button>
            )}
            <button className={`btn btn-block ${shareOk ? 'btn-ghost' : 'btn-primary'}`} onClick={onDownload}>
              <Download /> {t('Yuklab olish')}
            </button>
            <p className="xs faint" style={{ textAlign: 'center' }}>
              {shareOk
                ? t('iPhone’da "Ulashish" → "Fayllarga saqlash" ni tanlang')
                : t('Fayl "Yuklashlar" papkasiga saqlanadi')}
            </p>
          </div>
        )}
      </Sheet>
    </>
  );
}
