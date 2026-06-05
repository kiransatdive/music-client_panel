import { useEffect, useState } from 'react';
import axios from 'axios';
import { getBackendUrl } from '../utils/config';
import { X, Music, Disc, Clock, Globe } from 'lucide-react';

interface ReleaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  releaseId: number | null;
}

export default function ReleaseDetailsModal({ isOpen, onClose, releaseId }: ReleaseDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && releaseId) {
      fetchDetails();
    } else {
      setDetails(null);
      setError('');
    }
  }, [isOpen, releaseId]);

  const fetchDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const reqConfig = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.get(`${getBackendUrl()}/api/releases/${releaseId}`, reqConfig);
      if (res.data?.success && res.data?.data) {
        setDetails(res.data.data);
      } else {
        setDetails(res.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch release details:', err);
      setError('Failed to load release details.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-dark-card w-full max-w-4xl rounded-2xl shadow-xl border border-slate-200 dark:border-dark-border/40 my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-dark-border/40">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Release Details</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">{error}</div>
          ) : details ? (
            <div className="space-y-8">
              
              {/* Main Info */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="h-48 w-48 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 dark:border-dark-border/40 flex-shrink-0">
                  {details.artwork ? (
                    <img src={details.artwork.startsWith('http') ? details.artwork : `${getBackendUrl()}/${details.artwork}`} alt={details.title} className="h-full w-full object-cover" />
                  ) : (
                    <Disc className="h-16 w-16 text-slate-400" />
                  )}
                </div>
                
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">{details.title}</h3>
                    <p className="text-slate-500 font-medium">
                      <span className="capitalize text-rose-500">{details.releaseType || details.release_type}</span> • {details.genre} • {details.language}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-dark-border/40">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">Status</span>
                      <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold uppercase tracking-wider">
                        {(details.status || '').replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">Release Date</span>
                      <span className="text-slate-800 dark:text-white font-medium">{new Date(details.releaseDate || details.release_date).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">Label</span>
                      <span className="text-slate-800 dark:text-white font-medium">{details.labelName || details.label_name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">UPC</span>
                      <span className="text-slate-800 dark:text-white font-medium font-mono">{details.upc || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Platforms Section */}
              {details.platforms && details.platforms.length > 0 && (
                <div className="pt-4 border-t border-slate-100 dark:border-dark-border/40">
                  <div className="flex items-center gap-2 mb-3 text-slate-700 dark:text-slate-300">
                    <Globe size={18} />
                    <h4 className="text-md font-bold">Distribution Platforms</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {details.platforms.map((platform: any) => (
                      <span key={platform.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 text-blue-700 dark:text-blue-300 text-xs font-bold capitalize">
                        {platform.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tracks Section */}
              <div>
                <div className="flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-300">
                  <Music size={20} />
                  <h4 className="text-lg font-bold">Tracks ({(details.tracks || details.Tracks)?.length || 0})</h4>
                </div>
                
                {(details.tracks || details.Tracks) && (details.tracks || details.Tracks).length > 0 ? (
                  <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border/40 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-dark-border/40">
                          <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Track Title</th>
                          <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Duration (MM:SS)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-dark-border/40">
                        {(details.tracks || details.Tracks).map((track: any, idx: number) => (
                          <tr key={track.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">{track.trackTitle || track.track_title || track.title}</td>
                            <td className="py-3 px-4 text-sm text-slate-500">
                              <div className="flex items-center gap-1.5">
                                <Clock size={14}/> 
                                {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-dark-border/40 text-slate-500">
                    No tracks found for this release.
                  </div>
                )}
              </div>

            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
