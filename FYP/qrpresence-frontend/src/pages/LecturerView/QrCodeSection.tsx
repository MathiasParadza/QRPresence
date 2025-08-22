import { useState, useEffect, useMemo } from "react";
import { Trash2, Loader2, AlertCircle, Download, RefreshCw } from "lucide-react";
import './QrCodeSection.css';

interface QrCodeItem {
  id: number;
  url: string;
  filename: string;
  name: string;
  session: string;
  created_at: string;
  expires_at?: string | null;
}

interface QrCodeSectionProps {
  qrCodes: QrCodeItem[];
  latestQrCode: QrCodeItem | null;
  onDownload: (id?: number) => void;
  onDelete: (id: number) => void;
  onRefresh?: () => void;
}

export const QrCodeSection = ({ 
  qrCodes, 
  latestQrCode,
  onDownload,
  onDelete,
  onRefresh
}: QrCodeSectionProps) => {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [imageStatus, setImageStatus] = useState<Record<number, 'loading' | 'loaded' | 'error'>>({});
  const [latestQrStatus, setLatestQrStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  // Memoize expired checks to prevent unnecessary recalculations
  const expiredStatus = useMemo(() => {
    return qrCodes.reduce((acc, qr) => {
      acc[qr.id] = qr.expires_at ? new Date(qr.expires_at) < new Date() : false;
      return acc;
    }, {} as Record<number, boolean>);
  }, [qrCodes]);

  // Initialize image statuses
  useEffect(() => {
    const initialStatus: Record<number, 'loading' | 'loaded' | 'error'> = {};
    qrCodes.forEach(qr => {
      initialStatus[qr.id] = 'loading';
    });
    setImageStatus(initialStatus);
  }, [qrCodes]);

  // Reset latest QR code status when it changes
  useEffect(() => {
    if (latestQrCode) {
      setLatestQrStatus('loading');
    }
  }, [latestQrCode]);

  return (
    <div className="qr-section">
      <div className="qr-section__container">
        {/* Latest QR Code Section */}
        {latestQrCode && (
          <div className="qr-card">
            <div className="qr-card__content">
              <div className="qr-card__header">
                <div className="qr-card__title-section">
                  <div className="qr-card__status-indicator"></div>
                  <h2 className="qr-card__title">Latest Attendance QR Code</h2>
                </div>
                {onRefresh && (
                  <button 
                    onClick={onRefresh}
                    className="qr-button qr-button--secondary"
                  >
                    <RefreshCw className="qr-icon" />
                    Refresh List
                  </button>
                )}
              </div>
              
              <div className="qr-preview">
                <div className="qr-preview__overlay"></div>
                
                {latestQrStatus === 'loading' && (
                  <div className="qr-preview__loading">
                    <Loader2 className="qr-icon qr-icon--spinning" />
                    <span className="qr-preview__loading-text">Loading QR Code...</span>
                  </div>
                )}
                
                {latestQrStatus === 'error' ? (
                  <div className="qr-preview__error">
                    <div className="qr-preview__error-icon">
                      <AlertCircle className="qr-icon" />
                    </div>
                    <span className="qr-preview__error-text">Failed to load QR code</span>
                    <button 
                      onClick={() => setLatestQrStatus('loading')}
                      className="qr-button qr-button--primary qr-button--small"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <img 
                    src={latestQrCode.url}
                    alt={`QR Code for ${latestQrCode.session}`} 
                    className={`qr-preview__image ${latestQrStatus !== 'loaded' ? 'invisible' : ''}`}
                    onLoad={() => setLatestQrStatus('loaded')}
                    onError={() => {
                      console.error('Failed to load latest QR code:', latestQrCode.url);
                      setLatestQrStatus('error');
                    }}
                    crossOrigin="anonymous"
                    loading="eager"
                  />
                )}
              </div>
              
              <div className="qr-card__actions">
                <button
                  onClick={() => onDownload(latestQrCode.id)}
                  disabled={latestQrStatus !== 'loaded'}
                  className={`qr-button qr-button--primary ${latestQrStatus !== 'loaded' ? 'qr-button--disabled' : ''}`}
                >
                  <Download className="qr-icon" />
                  Download QR Code
                </button>
              </div>

              <div className="qr-card__info">
                <div className="qr-card__info-grid">
                  <div className="qr-card__info-item">
                    <span className="qr-card__info-label">Session</span>
                    <span className="qr-card__info-value">{latestQrCode.session}</span>
                  </div>
                  <div className="qr-card__info-item">
                    <span className="qr-card__info-label">Created</span>
                    <span className="qr-card__info-value">{latestQrCode.created_at}</span>
                  </div>
                  {latestQrCode.expires_at && (
                    <div className="qr-card__info-item">
                      <span className="qr-card__info-label">
                        {expiredStatus[latestQrCode.id] ? "Status" : "Expires"}
                      </span>
                      <span className={`qr-card__info-value ${
                        expiredStatus[latestQrCode.id] ? "qr-card__info-value--error" : "qr-card__info-value--success"
                      }`}>
                        {expiredStatus[latestQrCode.id] ? (
                          <>
                            <span className="qr-card__status-dot qr-card__status-dot--error"></span>
                            Expired
                          </>
                        ) : (
                          <>
                            <span className="qr-card__status-dot qr-card__status-dot--success"></span>
                            {latestQrCode.expires_at}
                          </>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All QR Codes Grid */}
        <div className="qr-card">
          <div className="qr-card__header qr-card__header--center">
            <div className="qr-card__title-section">
              <div className="qr-card__icon-wrapper">
                <span className="qr-card__icon">📚</span>
              </div>
              <h3 className="qr-card__title qr-card__title--small">
                All QR Codes
              </h3>
            </div>
            <div className="qr-card__count">
              <span>{qrCodes.length} codes</span>
            </div>
          </div>
          
          {qrCodes.length === 0 ? (
            <div className="qr-card__empty">
              <div className="qr-card__empty-content">
                <div className="qr-card__empty-icon">🎯</div>
                <h3 className="qr-card__empty-title">No QR codes yet</h3>
                <p className="qr-card__empty-text">Generate your first QR code to get started!</p>
              </div>
            </div>
          ) : (
            <div className="qr-grid">
              {qrCodes.map((qr) => {
                const expired = expiredStatus[qr.id];
                const status = imageStatus[qr.id] || 'loading';

                return (
                  <div
                    key={qr.id}
                    className={`qr-item ${expired ? 'qr-item--expired' : ''}`}
                  >
                    <div className="qr-item__content">
                      <div className={`qr-item__preview ${expired ? 'qr-item__preview--expired' : ''}`}>
                        {status === 'loading' && (
                          <div className="qr-item__loading">
                            <Loader2 className="qr-icon qr-icon--spinning" />
                            <span className="qr-item__loading-text">Loading...</span>
                          </div>
                        )}
                        
                        {status === 'error' ? (
                          <div className="qr-item__error">
                            <div className="qr-item__error-icon">
                              <AlertCircle className="qr-icon" />
                            </div>
                            <span className="qr-item__error-text">Load failed</span>
                            <button 
                              onClick={() => setImageStatus(prev => ({...prev, [qr.id]: 'loading'}))}
                              className="qr-button qr-button--primary qr-button--tiny"
                            >
                              Retry
                            </button>
                          </div>
                        ) : (
                          <img 
                            src={qr.url}
                            alt={`QR Code for ${qr.session}`} 
                            className={`qr-item__image ${status !== 'loaded' ? 'invisible' : ''} ${
                              expired ? 'qr-item__image--expired' : ''
                            }`}
                            onLoad={() => setImageStatus(prev => ({...prev, [qr.id]: 'loaded'}))}
                            onError={() => {
                              console.error('Failed to load QR code:', qr.url);
                              setImageStatus(prev => ({...prev, [qr.id]: 'error'}));
                            }}
                            crossOrigin="anonymous"
                            loading="lazy"
                          />
                        )}
                        
                        {expired && (
                          <div className="qr-item__expired-badge">
                            Expired
                          </div>
                        )}
                      </div>
                      
                      <div className="qr-item__details">
                        <div className="qr-item__session">
                          <p className="qr-item__session-text" title={qr.session}>
                            {qr.session}
                          </p>
                          <div className="qr-item__meta">
                            <p className="qr-item__meta-item">
                              <span className="qr-item__meta-dot"></span>
                              Created: {qr.created_at}
                            </p>
                            {qr.expires_at && (
                              <p className={`qr-item__meta-item ${
                                expired ? 'qr-item__meta-item--error' : 'qr-item__meta-item--success'
                              }`}>
                                <span className={`qr-item__meta-dot ${
                                  expired ? 'qr-item__meta-dot--error' : 'qr-item__meta-dot--success'
                                }`}></span>
                                {expired ? "Expired" : "Expires"}: {qr.expires_at}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="qr-item__actions">
                          <button
                            onClick={() => onDownload(qr.id)}
                            disabled={status !== 'loaded'}
                            className={`qr-button qr-button--secondary qr-button--small ${
                              status !== 'loaded' ? 'qr-button--disabled' : ''
                            }`}
                          >
                            <Download className="qr-icon" />
                            Download
                          </button>
                          <button
                            onClick={() => setDeleteId(qr.id)}
                            className="qr-button qr-button--danger qr-button--small"
                          >
                            <Trash2 className="qr-icon" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Deletion Confirmation Modal */}
        {deleteId !== null && (
          <div className="qr-modal">
            <div className="qr-modal__content">
              <div className="qr-modal__header">
                <div className="qr-modal__icon">
                  <Trash2 className="qr-icon" />
                </div>
                <h2 className="qr-modal__title">
                  Confirm Deletion
                </h2>
                <p className="qr-modal__text">
                  Are you sure you want to delete this QR code? This action cannot be undone and will permanently remove the code from your collection.
                </p>
              </div>

              <div className="qr-modal__actions">
                <button
                  onClick={() => setDeleteId(null)}
                  className="qr-button qr-button--secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDelete(deleteId);
                    setDeleteId(null);
                  }}
                  className="qr-button qr-button--danger"
                >
                  <Trash2 className="qr-icon" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};