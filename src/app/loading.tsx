export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
          <svg 
            width="48" 
            height="48" 
            viewBox="0 0 32 32" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="object-contain"
          >
            <circle cx="16" cy="16" r="16" fill="#1f2937"/>
            <text x="8" y="20" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="white">AS</text>
            <rect x="20" y="14" width="8" height="1" fill="#3b82f6"/>
            <rect x="20" y="17" width="6" height="1" fill="#3b82f6"/>
            <rect x="20" y="20" width="4" height="1" fill="#3b82f6"/>
          </svg>
        </div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando...</p>
      </div>
    </div>
  );
}
