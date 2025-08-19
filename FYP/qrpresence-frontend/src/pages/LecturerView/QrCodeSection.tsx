import { useState, useEffect, useMemo } from "react";
import { Trash2, Loader2, AlertCircle, Download, RefreshCw } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Latest QR Code Section */}
        {latestQrCode && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-purple-100 p-8">
            <div className="text-center space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 bg-clip-text text-transparent">
                    Latest Attendance QR Code
                  </h2>
                </div>
                {onRefresh && (
                  <button 
                    onClick={onRefresh}
                    className="group bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-full flex items-center gap-2 transition-all duration-300 border border-blue-200 hover:border-blue-300"
                  >
                    <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                    Refresh List
                  </button>
                )}
              </div>
              
              <div className="relative mx-auto w-80 h-80 bg-gradient-to-br from-green-50 to-blue-50 border-4 border-green-400 rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-100/50 to-blue-100/50 rounded-3xl"></div>
                
                {latestQrStatus === 'loading' && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="animate-spin text-purple-600" size={32} />
                      <span className="text-sm text-grey-600">Loading QR Code...</span>
                    </div>
                  </div>
                )}
                
                {latestQrStatus === 'error' ? (
                  <div className="flex flex-col items-center justify-center p-6 text-red-500 z-10">
                    <div className="bg-red-50 rounded-full p-4 mb-4">
                      <AlertCircle size={40} className="text-red-500" />
                    </div>
                    <span className="text-lg font-medium mb-3">Failed to load QR code</span>
                    <button 
                      onClick={() => setLatestQrStatus('loading')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <img 
                    src={latestQrCode.url}
                    alt={`QR Code for ${latestQrCode.session}`} 
                    className={`w-full h-full object-contain z-10 rounded-2xl ${latestQrStatus !== 'loaded' ? 'invisible' : ''}`}
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
              
              <div className="flex justify-center">
                <button
                  onClick={() => onDownload(latestQrCode.id)}
                  disabled={latestQrStatus !== 'loaded'}
                  className={`group bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
                    latestQrStatus !== 'loaded' ? 'opacity-50 cursor-not-allowed hover:transform-none' : ''
                  }`}
                  >
                  <Download size={22} className="group-hover:animate-bounce" />
                  Download QR Code
                </button>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-grey-500 font-medium">Session</span>
                    <span className="text-purple-700 font-semibold text-lg">{latestQrCode.session}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-grey-500 font-medium">Created</span>
                    <span className="text-blue-700 font-semibold">{latestQrCode.created_at}</span>
                  </div>
                  {latestQrCode.expires_at && (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-grey-500 font-medium">
                        {expiredStatus[latestQrCode.id] ? "Status" : "Expires"}
                      </span>
                      <span className={`font-semibold flex items-center gap-2 ${
                        expiredStatus[latestQrCode.id] ? "text-red-600" : "text-green-600"
                      }`}>
                        {expiredStatus[latestQrCode.id] ? (
                          <>
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            Expired
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
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
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-purple-100 p-8">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">📚</span>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                All QR Codes
              </h3>
            </div>
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 px-4 py-2 rounded-full">
              <span className="text-purple-700 font-semibold">{qrCodes.length} codes</span>
            </div>
          </div>
          
          {qrCodes.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gradient-to-br from-grey-100 to-blue-50 rounded-3xl p-12 max-w-md mx-auto">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-grey-600 mb-2">No QR codes yet</h3>
                <p className="text-grey-500">Generate your first QR code to get started!</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {qrCodes.map((qr) => {
                const expired = expiredStatus[qr.id];
                const status = imageStatus[qr.id] || 'loading';

                return (
                  <div
                    key={qr.id}
                    className={`group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border-2 ${
                      expired 
                        ? "border-red-200 bg-red-50/50" 
                        : "border-purple-100 hover:border-purple-300"
                    }`}
                  >
                    <div className="p-4 space-y-4">
                      <div className={`relative w-full aspect-square rounded-xl overflow-hidden ${
                        expired ? "bg-red-50" : "bg-gradient-to-br from-grey-50 to-blue-50"
                      } border-2 ${expired ? "border-red-200" : "border-purple-200"} flex items-center justify-center`}>
                        {status === 'loading' && (
                          <div className="absolute inset-0 flex items-center justify-center z-10">
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="animate-spin text-purple-500" size={20} />
                              <span className="text-xs text-grey-500">Loading...</span>
                            </div>
                          </div>
                        )}
                        
                        {status === 'error' ? (
                          <div className="flex flex-col items-center justify-center p-3 text-red-500 z-10">
                            <div className="bg-red-100 rounded-full p-2 mb-2">
                              <AlertCircle size={20} />
                            </div>
                            <span className="text-xs font-medium mb-2">Load failed</span>
                            <button 
                              onClick={() => setImageStatus(prev => ({...prev, [qr.id]: 'loading'}))}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-full text-xs transition-colors"
                            >
                              Retry
                            </button>
                          </div>
                        ) : (
                          <img 
                            src={qr.url}
                            alt={`QR Code for ${qr.session}`} 
                            className={`w-full h-full object-contain rounded-lg ${status !== 'loaded' ? 'invisible' : ''} ${
                              expired ? "opacity-60 grayscale" : ""
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
                          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                            Expired
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div className="text-center">
                          <p className="font-semibold text-purple-700 truncate text-sm" title={qr.session}>
                            {qr.session}
                          </p>
                          <div className="flex flex-col gap-1 mt-2">
                            <p className="text-xs text-grey-600 flex items-center justify-center gap-1">
                              <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                              Created: {qr.created_at}
                            </p>
                            {qr.expires_at && (
                              <p className={`text-xs flex items-center justify-center gap-1 ${
                                expired ? "text-red-600 font-medium" : "text-green-600"
                              }`}>
                                <span className={`w-1 h-1 rounded-full ${
                                  expired ? "bg-red-500" : "bg-green-500"
                                }`}></span>
                                {expired ? "Expired" : "Expires"}: {qr.expires_at}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => onDownload(qr.id)}
                            disabled={status !== 'loaded'}
                            className={`group bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-full flex items-center gap-1 text-sm font-medium transition-all duration-200 border border-blue-200 hover:border-blue-300 ${
                              status !== 'loaded' ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
                            }`}
                          >
                            <Download size={14} className="group-hover:animate-bounce" />
                            Download
                          </button>
                          <button
                            onClick={() => setDeleteId(qr.id)}
                            className="group bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-full flex items-center gap-1 text-sm font-medium transition-all duration-200 border border-red-200 hover:border-red-300 hover:shadow-md"
                          >
                            <Trash2 size={14} className="group-hover:animate-pulse" />
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md space-y-6 animate-in zoom-in duration-300 border border-purple-200">
              <div className="text-center">
                <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={32} className="text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-grey-800 mb-2">
                  Confirm Deletion
                </h2>
                <p className="text-grey-600 leading-relaxed">
                  Are you sure you want to delete this QR code? This action cannot be undone and will permanently remove the code from your collection.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 px-6 py-3 rounded-2xl border-2 border-grey-300 text-grey-700 hover:bg-grey-50 transition-all duration-200 font-medium hover:border-grey-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDelete(deleteId);
                    setDeleteId(null);
                  }}
                  className="flex-1 px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl"
                >
                  <Trash2 size={18} />
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