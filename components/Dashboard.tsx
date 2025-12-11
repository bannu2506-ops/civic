import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CivicReport, Severity } from '../types';

interface DashboardProps {
  reports: CivicReport[];
  onUpdateReport: (id: string, updates: Partial<CivicReport>) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard: React.FC<DashboardProps> = ({ reports, onUpdateReport }) => {
  const [selectedReport, setSelectedReport] = useState<CivicReport | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Aggregate data for charts
  const severityData = [
    { name: 'Low', value: reports.filter(r => r.severity === Severity.LOW).length },
    { name: 'Medium', value: reports.filter(r => r.severity === Severity.MEDIUM).length },
    { name: 'High', value: reports.filter(r => r.severity === Severity.HIGH).length },
    { name: 'Critical', value: reports.filter(r => r.severity === Severity.CRITICAL).length },
  ];

  const typeData = reports.reduce((acc, curr) => {
    const found = acc.find(item => item.name === curr.issueType);
    if (found) {
      found.value++;
    } else {
      acc.push({ name: curr.issueType.replace('_', ' '), value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const handleAction = async (action: 'DISPATCH' | 'RESOLVE' | 'REJECT') => {
    if (!selectedReport) return;
    setIsProcessing(true);

    // Simulate API call to municipal backend
    await new Promise(resolve => setTimeout(resolve, 1000));

    let statusUpdate: CivicReport['status'] = 'PENDING';
    if (action === 'DISPATCH') statusUpdate = 'DISPATCHED';
    if (action === 'RESOLVE') statusUpdate = 'RESOLVED';
    if (action === 'REJECT') statusUpdate = 'REVIEWED'; // Or logic for rejected

    onUpdateReport(selectedReport.id, { status: statusUpdate });
    setIsProcessing(false);
    setSelectedReport(null);
  };

  // Construct the Authority JSON payload matching spec
  const getAuthorityJson = (report: CivicReport) => {
    return JSON.stringify({
      id: report.id,
      issue_type: report.issueType,
      confidence: report.confidence,
      severity: report.severity.toLowerCase(),
      location: {
        lat: report.location.latitude,
        lon: report.location.longitude,
        address: report.location.address
      },
      timestamp: report.timestamp,
      evidence: ["https://storage.googleapis.com/civic-eye/evidence/" + report.id + ".jpg"], // Simulated URL
      notes: `Suggested action: ${report.recommendedAction}. SLA: ${report.slaEstimate}`
    }, null, 2);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500 uppercase">Total Reports</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{reports.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500 uppercase">Critical Issues</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{reports.filter(r => r.severity === Severity.CRITICAL).length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500 uppercase">Avg Confidence</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {(reports.reduce((acc, r) => acc + r.confidence, 0) / (reports.length || 1) * 100).toFixed(0)}%
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500 uppercase">Pending Review</p>
          <p className="text-3xl font-bold text-orange-500 mt-2">{reports.filter(r => r.status === 'PENDING').length}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-96">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Reports by Issue Type</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={typeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={140} tick={{fontSize: 12}} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar dataKey="value" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-96">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Severity Distribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-[-20px] text-xs text-slate-600">
            {severityData.map((entry, index) => (
              <div key={index} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></span>
                {entry.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">Incoming Reports Console</h3>
          <span className="flex items-center gap-2 text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live Feed
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4">Issue Type</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {reports.slice().reverse().map((report) => (
                <tr 
                  key={report.id} 
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedReport(report)}
                >
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      report.status === 'PENDING' ? 'bg-orange-100 text-orange-800' :
                      report.status === 'DISPATCHED' ? 'bg-blue-100 text-blue-800' :
                      report.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                         report.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                         report.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                         report.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                         'bg-green-100 text-green-800'
                      }`}>
                      {report.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">{report.issueType.replace('_', ' ')}</td>
                  <td className="px-6 py-4 font-mono text-xs max-w-[200px] truncate">
                    {report.location.address || `${report.location.latitude.toFixed(4)}, ${report.location.longitude.toFixed(4)}`}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(report.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:text-blue-800 font-medium text-xs uppercase">Review</button>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No reports pending. Waiting for incoming data...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Authority Action Console</h2>
                <p className="text-slate-500 text-sm">Reviewing Report ID: <span className="font-mono text-slate-700">{selectedReport.id.split('-')[0]}...</span></p>
              </div>
              <button 
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-grow overflow-y-auto p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                
                {/* Left Column: Visual Evidence */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Visual Evidence
                    </h3>
                    <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-inner relative group">
                      <img src={selectedReport.imageUrl} alt="Issue Evidence" className="w-full h-full object-contain" />
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                        {new Date(selectedReport.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Location Data
                    </h3>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Address:</span>
                        <span className="font-medium text-right">{selectedReport.location.address || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Coordinates:</span>
                        <span className="font-mono text-right">{selectedReport.location.latitude.toFixed(6)}, {selectedReport.location.longitude.toFixed(6)}</span>
                      </div>
                      {selectedReport.location.googleMapsUrl && (
                        <a 
                          href={selectedReport.location.googleMapsUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="block text-center mt-2 w-full py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 font-semibold transition-colors"
                        >
                          Open in Google Maps
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Details & JSON */}
                <div className="flex flex-col space-y-6">
                  <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-lg">
                    <h3 className="text-indigo-900 font-bold text-lg mb-2">AI Assessment</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="block text-indigo-400 text-xs uppercase">Issue Type</span>
                        <span className="font-semibold text-indigo-900">{selectedReport.issueType.replace('_', ' ')}</span>
                      </div>
                      <div>
                        <span className="block text-indigo-400 text-xs uppercase">Severity</span>
                        <span className={`font-semibold ${
                          selectedReport.severity === 'CRITICAL' ? 'text-red-600' : 'text-indigo-900'
                        }`}>{selectedReport.severity}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-indigo-400 text-xs uppercase">Recommendation</span>
                        <span className="text-indigo-900">{selectedReport.recommendedAction}</span>
                      </div>
                      <div className="col-span-2">
                         <span className="block text-indigo-400 text-xs uppercase">Department</span>
                         <span className="font-semibold text-indigo-900">{selectedReport.suggestedDepartment}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-grow flex flex-col min-h-0">
                    <h3 className="font-semibold text-slate-700 mb-2 flex justify-between items-center">
                      <span>Generated JSON Payload</span>
                      <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded">Read-only</span>
                    </h3>
                    <div className="bg-slate-900 rounded-lg p-4 overflow-auto flex-grow text-xs font-mono text-green-400 shadow-inner">
                      <pre>{getAuthorityJson(selectedReport)}</pre>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
               <div className="text-sm text-slate-500">
                  Current Status: <span className="font-bold uppercase text-slate-700">{selectedReport.status}</span>
               </div>
               <div className="flex space-x-3">
                 <button 
                  onClick={() => handleAction('REJECT')}
                  disabled={isProcessing}
                  className="px-6 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                 >
                   Reject / Close
                 </button>
                 <button 
                  onClick={() => handleAction('DISPATCH')}
                  disabled={isProcessing || selectedReport.status === 'DISPATCHED'}
                  className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                 >
                   {isProcessing ? (
                     <>
                       <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                       Dispatching...
                     </>
                   ) : selectedReport.status === 'DISPATCHED' ? 'Dispatched' : `Dispatch to ${selectedReport.suggestedDepartment}`}
                 </button>
               </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;