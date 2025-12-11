import React, { useState, useRef, useEffect } from 'react';
import { analyzeImage, getAddressFromCoordinates } from '../services/geminiService';
import { AnalysisResult, CivicReport, IssueType, Severity, LocationData } from '../types';
// @ts-ignore
import EXIF from 'exif-js';

interface ReportFormProps {
  onReportSubmit: (report: CivicReport) => void;
}

const ReportForm: React.FC<ReportFormProps> = ({ onReportSubmit }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Update location state to use the LocationData interface
  const [location, setLocation] = useState<LocationData | null>(null);
  
  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'found' | 'extracted' | 'error'>('idle');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Attempt to get device location on mount as fallback
    getLocation();
  }, []);

  const getLocation = () => {
    // Only fetch device location if we haven't already extracted one from an image
    if (locationStatus === 'extracted') return;

    setLocationStatus('locating');
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setLocationStatus('found');
      },
      () => setLocationStatus('error'),
      { enableHighAccuracy: true }
    );
  };

  const convertDMSToDD = (dms: number[], ref: string) => {
    if (!dms || dms.length < 3) return 0;
    let dd = dms[0] + dms[1] / 60 + dms[2] / 3600;
    if (ref === "S" || ref === "W") {
      dd = dd * -1;
    }
    return dd;
  };

  const extractLocationFromImage = (file: File) => {
    // @ts-ignore
    EXIF.getData(file, function() {
      // @ts-ignore
      const latData = EXIF.getTag(this, "GPSLatitude");
      // @ts-ignore
      const latRef = EXIF.getTag(this, "GPSLatitudeRef");
      // @ts-ignore
      const longData = EXIF.getTag(this, "GPSLongitude");
      // @ts-ignore
      const longRef = EXIF.getTag(this, "GPSLongitudeRef");

      if (latData && latRef && longData && longRef) {
        const lat = convertDMSToDD(latData, latRef);
        const lng = convertDMSToDD(longData, longRef);
        
        setLocation({
          latitude: lat,
          longitude: lng,
          accuracy: 5 // High confidence for explicit metadata
        });
        setLocationStatus('extracted');
      } else {
        // If no EXIF data, ensure we fall back to device location
        if (locationStatus !== 'found') {
          getLocation();
        }
      }
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 1. Preview Image
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setAnalysisResult(null); // Reset previous analysis
      };
      reader.readAsDataURL(file);

      // 2. Extract Location Metadata
      extractLocationFromImage(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    try {
      const base64Data = selectedImage.split(',')[1];
      const locContext = location ? `Coordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : undefined;
      
      // Parallel execution: Analyze image AND fetch address if location exists
      const analysisPromise = analyzeImage(base64Data, locContext);
      
      let addressPromise: Promise<{ address: string; googleMapsUri?: string }> = Promise.resolve({ address: "", googleMapsUri: "" });
      if (location) {
        addressPromise = getAddressFromCoordinates(location.latitude, location.longitude);
      }

      const [result, addressResult] = await Promise.all([analysisPromise, addressPromise]);
      
      setAnalysisResult(result);

      // Update location with the found address
      if (location && addressResult.address) {
        setLocation(prev => prev ? ({
          ...prev,
          address: addressResult.address,
          googleMapsUrl: addressResult.googleMapsUri
        }) : null);
      }

    } catch (error) {
      alert("Failed to analyze image. Please try again.");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmitReport = () => {
    if (!analysisResult || !selectedImage) return;

    const newReport: CivicReport = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      issueType: analysisResult.issue_type as IssueType,
      severity: analysisResult.severity as Severity,
      confidence: analysisResult.confidence,
      description: analysisResult.description,
      recommendedAction: analysisResult.recommended_action,
      suggestedDepartment: analysisResult.suggested_department,
      slaEstimate: analysisResult.sla_estimate,
      location: {
        latitude: location?.latitude || 0,
        longitude: location?.longitude || 0,
        accuracy: location?.accuracy,
        address: location?.address,
        googleMapsUrl: location?.googleMapsUrl
      },
      imageUrl: selectedImage,
      hasPII: analysisResult.has_pii,
      status: 'PENDING'
    };

    onReportSubmit(newReport);
    
    // Reset form
    setSelectedImage(null);
    setAnalysisResult(null);
    setLocationStatus('idle'); // Reset location status
    getLocation(); // Reset to device location for next time
    alert("Report submitted successfully to the authorities!");
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800">Report a Civic Issue</h2>
          <p className="text-slate-500 text-sm mt-1">Upload a photo or CCTV frame to automatically detect and report infrastructure problems.</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Location Status */}
          <div className={`flex items-center justify-between p-3 rounded-lg border ${
            locationStatus === 'extracted' ? 'bg-indigo-50 border-indigo-200' : 'bg-blue-50 border-blue-100'
          }`}>
            <div className="flex items-center space-x-2">
              {locationStatus === 'extracted' ? (
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
              
              <span className={`text-sm font-medium ${locationStatus === 'extracted' ? 'text-indigo-800' : 'text-blue-800'}`}>
                {locationStatus === 'extracted' 
                  ? `Location detected from Image`
                  : locationStatus === 'found' 
                    ? `Device GPS Active (${location?.accuracy?.toFixed(0)}m accuracy)` 
                    : 'Locating device...'}
              </span>
            </div>
            {locationStatus === 'error' && (
              <button onClick={getLocation} className="text-xs text-red-600 font-semibold underline">Retry GPS</button>
            )}
            {locationStatus === 'found' && (
              <span className="text-xs text-blue-500">Using live location</span>
            )}
            {locationStatus === 'extracted' && (
              <span className="text-xs text-indigo-500">Using photo metadata</span>
            )}
          </div>

          {/* Upload Area */}
          <div className="space-y-4">
            {!selectedImage ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-colors"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange}
                />
                <svg className="w-12 h-12 mx-auto text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-slate-600 font-medium">Click to upload photo or CCTV frame</p>
                <p className="text-slate-400 text-xs mt-1">Supports JPG, PNG (Max 5MB)</p>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-slate-200">
                <img src={selectedImage} alt="Preview" className="w-full h-64 object-cover" />
                {!isAnalyzing && !analysisResult && (
                  <button 
                    onClick={() => {
                      setSelectedImage(null);
                      setLocationStatus('idle');
                      getLocation();
                    }}
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons & Results */}
          {selectedImage && !analysisResult && (
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className={`w-full py-3 px-4 rounded-lg font-bold text-white shadow-md transition-all ${
                isAnalyzing 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.01]'
              }`}
            >
              {isAnalyzing ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Analyzing Issue & Location...</span>
                </div>
              ) : 'Analyze Issue'}
            </button>
          )}

          {analysisResult && (
            <div className="animate-fade-in-up space-y-6">
              <div className={`p-5 rounded-xl border-l-4 ${
                analysisResult.severity === 'CRITICAL' ? 'bg-red-50 border-red-500' :
                analysisResult.severity === 'HIGH' ? 'bg-orange-50 border-orange-500' :
                analysisResult.severity === 'MEDIUM' ? 'bg-yellow-50 border-yellow-500' :
                'bg-green-50 border-green-500'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      {analysisResult.issue_type.replace('_', ' ')}
                      <span className={`text-xs px-2 py-1 rounded-full text-white ${
                         analysisResult.severity === 'CRITICAL' ? 'bg-red-500' :
                         analysisResult.severity === 'HIGH' ? 'bg-orange-500' :
                         analysisResult.severity === 'MEDIUM' ? 'bg-yellow-500' :
                         'bg-green-500'
                      }`}>
                        {analysisResult.severity}
                      </span>
                    </h3>
                    <p className="text-slate-600 mt-2 text-sm leading-relaxed">{analysisResult.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-3xl font-bold text-slate-800">{(analysisResult.confidence * 100).toFixed(0)}%</span>
                    <span className="text-xs text-slate-500 uppercase tracking-wide">Confidence</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {/* Address Section - New Feature */}
                  <div className="sm:col-span-2 bg-white/80 p-3 rounded-lg border border-indigo-100">
                     <span className="block text-indigo-500 text-xs font-semibold uppercase mb-1">Detected Location</span>
                     <div className="flex items-start justify-between">
                       <p className="font-medium text-slate-800 pr-4">{location?.address || "Address unavailable"}</p>
                       {location?.googleMapsUrl && (
                         <a 
                           href={location.googleMapsUrl} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="flex-shrink-0 flex items-center text-blue-600 hover:text-blue-800 text-xs font-semibold bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                         >
                           <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                           View Map
                         </a>
                       )}
                     </div>
                     <p className="text-xs text-slate-400 mt-1 font-mono">{location?.latitude.toFixed(6)}, {location?.longitude.toFixed(6)}</p>
                  </div>

                  <div className="bg-white/60 p-3 rounded-lg">
                    <span className="block text-slate-500 text-xs font-semibold uppercase">Action</span>
                    <span className="font-medium text-slate-800">{analysisResult.recommended_action}</span>
                  </div>
                  <div className="bg-white/60 p-3 rounded-lg">
                    <span className="block text-slate-500 text-xs font-semibold uppercase">Department</span>
                    <span className="font-medium text-slate-800">{analysisResult.suggested_department}</span>
                  </div>
                  <div className="bg-white/60 p-3 rounded-lg">
                    <span className="block text-slate-500 text-xs font-semibold uppercase">SLA Target</span>
                    <span className="font-medium text-slate-800">{analysisResult.sla_estimate}</span>
                  </div>
                  {analysisResult.has_pii && (
                    <div className="bg-white/60 p-3 rounded-lg flex items-center space-x-2 text-indigo-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                      <span className="font-semibold">Privacy Protection Active</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setAnalysisResult(null)}
                  className="flex-1 py-3 px-4 border border-slate-300 rounded-lg font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Discard
                </button>
                <button 
                  onClick={handleSubmitReport}
                  className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-md transition-colors"
                >
                  Submit Official Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportForm;