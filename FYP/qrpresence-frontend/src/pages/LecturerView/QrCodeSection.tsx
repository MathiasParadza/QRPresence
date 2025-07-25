interface QrCodeSectionProps {
  qrCodes: string[];
  qrCodeUrl: string | null;
  onDownload: () => void;
}

export const QrCodeSection = ({ 
  qrCodes, 
  qrCodeUrl,
  onDownload 
}: QrCodeSectionProps) => {
  return (
    <div className="space-y-8">
      {qrCodeUrl && (
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-purple-700">Latest Attendance QR Code</h2>
          <img 
            src={qrCodeUrl} 
            alt="Latest QR Code" 
            className="mx-auto w-64 h-64 border-4 border-green-400 rounded-xl shadow-lg" 
          />
          <button
            onClick={onDownload}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
          >
            ⬇️ Download Latest QR Code
          </button>
        </div>
      )}

      <div>
        <h3 className="text-xl font-semibold text-purple-600 mb-4 text-center">📚 All QR Codes</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {qrCodes.map((url, index) => (
            <div key={index} className="flex flex-col items-center space-y-2">
              <img 
                src={url} 
                alt={`QR Code ${index + 1}`} 
                className="w-40 h-40 border border-gray-300 rounded-lg" 
              />
              <a
                href={url}
                download={`qr_code_${index + 1}.png`}
                className="text-sm text-blue-600 hover:underline"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};