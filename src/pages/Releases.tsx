import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { getBackendUrl } from '../utils/config';
import { Plus, Clock, CheckCircle, XCircle, Play, Pause, Grid, List, Search, Disc, Ban, AlertTriangle, Trash2, UploadCloud, Globe, ChevronLeft, ChevronRight, Eye, Pencil } from 'lucide-react';
import ReleaseDetailsModal from '../components/ReleaseDetailsModal';

interface Release {
  id: number;
  title: string;
  status: 'draft' | 'uploaded' | 'pending_review' | 'approved' | 'rejected' | 'distributed' | 'live' | 'taken_down';
  release_date: string;
  artwork?: string;
  artwork_path?: string | null;
  release_type: string;
  genre: string;
  upc?: string;
  isrc?: string;
  language?: string;
}

export default function Releases() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // Works well for grid (3x4 or 4x3)

  // View Release Details State
  const [viewReleaseId, setViewReleaseId] = useState<number | null>(null);

  // Audio Player State
  const [currentPlayingTrack, setCurrentPlayingTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchReleases();
  }, []);

  const fetchReleases = async () => {
    try {
      const token = localStorage.getItem('token');
      const reqConfig = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(`${getBackendUrl()}/api/releases`, reqConfig);
      const rawData = response.data;
      const releasesList = Array.isArray(rawData)
        ? rawData
        : (rawData && Array.isArray(rawData.data))
          ? rawData.data
          : [];

      const mapped = releasesList.map((item: any) => {
        // Normalize keys to support both camelCase (new API) and snake_case (old database schema)
        const normalizedItem = {
          ...item,
          release_type: item.release_type || item.releaseType || '',
          release_date: item.release_date || item.releaseDate || '',
          label_name: item.label_name || item.labelName || '',
          rejection_reason: item.rejection_reason || item.rejectionReason || null,
          language: item.language || null,
        };

        let artworkUrl = undefined;
        if (normalizedItem.artwork_path || normalizedItem.artwork) {
          const rawPath = normalizedItem.artwork_path || normalizedItem.artwork;
          const cleanPath = rawPath.replace(/\\/g, '/');
          const backendUrl = getBackendUrl();
          if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
            artworkUrl = cleanPath;
          } else if (cleanPath.startsWith('uploads/')) {
            artworkUrl = `${backendUrl}/${cleanPath}`;
          } else if (cleanPath.startsWith('covers/')) {
            artworkUrl = `${backendUrl}/${cleanPath}`;
          } else {
            artworkUrl = `${backendUrl}/uploads/${cleanPath}`;
          }
        }
        return {
          ...normalizedItem,
          artwork: artworkUrl
        };
      });
      setReleases(mapped);
    } catch (error) {
      console.error('Failed to fetch releases');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRelease = async (id: number, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the release "${title}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${getBackendUrl()}/api/releases/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data?.success) {
        // Filter out deleted release
        setReleases(releases.filter(r => r.id !== id));
        // Stop playing if deleting current track
        if (currentPlayingTrack?.releaseId === id) {
          setIsPlaying(false);
          setCurrentPlayingTrack(null);
        }
      } else {
        alert(response.data?.message || 'Failed to delete release.');
      }
    } catch (error) {
      console.error('Failed to delete release', error);
      alert('Failed to delete release. Please try again.');
    }
  };

  // Audio Playback effect
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          console.error("Audio playback error:", err);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentPlayingTrack]);

  const handlePlayRelease = async (release: Release) => {
    if (currentPlayingTrack?.releaseId === release.id) {
      setIsPlaying(!isPlaying);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const reqConfig = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.get(`/api/releases/${release.id}`, reqConfig);

      const rawData = res.data;
      let fetchedTracks = [];
      if (rawData) {
        if (rawData.success && rawData.data && Array.isArray(rawData.data.tracks)) {
          fetchedTracks = rawData.data.tracks;
        } else if (Array.isArray(rawData.tracks)) {
          fetchedTracks = rawData.tracks;
        }
      }

      let trackToPlay = null;
      if (fetchedTracks.length > 0) {
        const firstTrack = fetchedTracks[0];
        const rawFilePath = firstTrack.file_path || firstTrack.audioFile || firstTrack.filePath || '';
        const rawTitle = firstTrack.title || firstTrack.trackTitle || 'Preview';

        const backendUrl = getBackendUrl();
        const fileUrl = rawFilePath.startsWith('http')
          ? rawFilePath
          : `${backendUrl}/${rawFilePath}`;

        trackToPlay = {
          url: fileUrl,
          title: rawTitle,
          releaseTitle: release.title,
          releaseId: release.id,
          artwork: release.artwork
        };
      } else {
        trackToPlay = {
          url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          title: 'Preview: ' + release.title + ' (Mock Demo)',
          releaseTitle: release.title,
          releaseId: release.id,
          artwork: release.artwork
        };
      }

      setCurrentPlayingTrack(trackToPlay);
      setIsPlaying(true);
    } catch (err) {
      console.error("Failed to load tracks", err);
      setCurrentPlayingTrack({
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        title: 'Preview: ' + release.title + ' (Mock Demo)',
        releaseTitle: release.title,
        releaseId: release.id,
        artwork: release.artwork
      });
      setIsPlaying(true);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className="h-3.5 w-3.5" />;
      case 'uploaded':
        return <UploadCloud className="h-3.5 w-3.5" />;
      case 'pending_review':
        return <Clock className="h-3.5 w-3.5" />;
      case 'approved':
        return <CheckCircle className="h-3.5 w-3.5" />;
      case 'distributed':
        return <Globe className="h-3.5 w-3.5" />;
      case 'live':
        return <Play className="h-3.5 w-3.5" />;
      case 'rejected':
        return <XCircle className="h-3.5 w-3.5" />;
      case 'taken_down':
        return <Ban className="h-3.5 w-3.5" />;
      default:
        return <AlertTriangle className="h-3.5 w-3.5" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/50';
      case 'uploaded':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20';
      case 'pending_review':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
      case 'approved':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
      case 'distributed':
        return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-500/10 dark:text-fuchsia-400 dark:border-fuchsia-500/20';
      case 'live':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
      case 'taken_down':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/20 dark:text-slate-400 dark:border-slate-700/30';
    }
  };

  const filteredReleases = releases.filter(release => {
    const titleMatch = release.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const genreMatch = release.genre?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const matchesSearch = titleMatch || genreMatch;
    const matchesStatus = statusFilter === 'all' || release.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredReleases.length / itemsPerPage);
  const paginatedReleases = filteredReleases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">My Releases</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Manage and track your music submissions</p>
        </div>
        <Link to="/releases/create" className="btn-primary inline-flex items-center gap-2 text-sm justify-center py-2.5">
          <Plus size={18} />
          <span>New Release</span>
        </Link>
      </div>

      {/* Filters & Toggles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border/40 p-4 rounded-2xl shadow-soft">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search by title or genre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          {/* Filter dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field sm:w-48 bg-white dark:bg-dark-bg cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="uploaded">Uploaded</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="distributed">Distributed</option>
            <option value="live">Live</option>
            <option value="rejected">Rejected</option>
            <option value="taken_down">Taken Down</option>
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 border border-slate-100 dark:border-dark-border/40 p-1 rounded-xl bg-slate-50 dark:bg-dark-bg">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-dark-card shadow-sm text-rose-500' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-dark-card shadow-sm text-rose-500' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
        </div>
      ) : filteredReleases.length === 0 ? (
        <div className="card text-center py-16">
          <div className="h-16 w-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Disc size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Releases Found</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">Get started by creating your first music distribution release today.</p>
          <Link to="/releases/create" className="btn-primary inline-flex items-center gap-2">
            <Plus size={18} />
            <span>Create Release</span>
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Layout */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedReleases.map((release) => (
            <div key={release.id} className="card p-4 hover:translate-y-[-4px] flex flex-col justify-between group h-full">
              <div>
                {/* Artwork box with overlay play */}
                <div className="relative aspect-square rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-100 dark:border-dark-border/40 mb-4 group-hover:shadow-md transition-shadow">
                  {release.artwork ? (
                    <img src={release.artwork} alt={release.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Disc size={48} />
                    </div>
                  )}
                  {/* Play overlay button */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => handlePlayRelease(release)}
                      className="h-12 w-12 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg transform translate-y-3 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 active:scale-95"
                    >
                      {currentPlayingTrack?.releaseId === release.id && isPlaying ? (
                        <Pause size={24} />
                      ) : (
                        <Play size={24} className="ml-1" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Release details */}
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-rose-500 transition-colors line-clamp-1">{release.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
                    <span className="capitalize">{release.release_type}</span>
                    <span>•</span>
                    <span>{release.genre}</span>
                  </div>
                </div>
              </div>

              {/* Bottom tag & action */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-dark-border/20 flex items-center justify-between">
                <span className={`inline-flex justify-center w-28 flex-shrink-0 items-center gap-1.5 px-2 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${getStatusBadgeClass(release.status)}`}>
                  {getStatusIcon(release.status)}
                  <span className="truncate">{release.status.replace('_', ' ')}</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewReleaseId(release.id)}
                    className="text-xs font-semibold text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors mr-2"
                  >
                    View
                  </button>
                  <Link
                    to={`/releases/${release.id}`}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDeleteRelease(release.id, release.title)}
                    className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                    title="Delete Release"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List Layout - Modern Spotify-like Row Design */
        <div className="bg-transparent">
          
          {/* Column Headers */}
          <div className="hidden sm:flex items-center gap-4 py-2 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
             <div className="w-8 flex-shrink-0 text-center">#</div>
             <div className="h-14 w-14 flex-shrink-0"></div> {/* Artwork spacer */}
             <div className="flex-[1.5] min-w-0 pr-4">Title</div>
             <div className="flex-1 hidden md:block min-w-0 pr-4">Album</div>
             <div className="w-24 hidden lg:block pr-4">Language</div>
             <div className="w-28 hidden lg:block">Release Date</div>
             <div className="w-32 hidden sm:flex justify-center pr-4">Status</div>
             <div className="w-24"></div> {/* Actions spacer */}
          </div>

          <div className="flex flex-col gap-4">
            {paginatedReleases.map((release, index) => (
              <div key={release.id} className="flex items-center gap-4 py-4 px-5 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border/50 rounded-xl hover:shadow-md hover:border-slate-300 dark:hover:border-dark-border transition-all group">
                
                {/* 1. Index / Play Button */}
                <div className="w-8 flex items-center justify-center flex-shrink-0">
                  <span className="text-slate-400 text-sm font-medium group-hover:hidden">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </span>
                  <button
                    onClick={() => handlePlayRelease(release)}
                    className="hidden group-hover:flex items-center justify-center text-slate-700 dark:text-white"
                  >
                    {currentPlayingTrack?.releaseId === release.id && isPlaying ? (
                      <Pause size={16} fill="currentColor" />
                    ) : (
                      <Play size={16} fill="currentColor" />
                    )}
                  </button>
                </div>

                {/* 2. Artwork */}
                <div className="h-14 w-14 flex-shrink-0 bg-slate-100 dark:bg-slate-800 rounded-md shadow-sm overflow-hidden flex items-center justify-center">
                  {release.artwork ? (
                    <img src={release.artwork} alt={release.title} className="h-full w-full object-cover" />
                  ) : (
                    <Disc className="h-5 w-5 text-slate-400" />
                  )}
                </div>

                {/* 3. Title & Subtitle */}
                <div className="flex-[1.5] min-w-0 pr-4">
                  <h4 className="text-slate-900 dark:text-white font-semibold text-base truncate group-hover:text-rose-500 transition-colors">
                    {release.title}
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 text-xs truncate font-medium">
                    <span className="capitalize">{release.release_type}</span> • {release.genre}
                  </p>
                </div>

                {/* 4. Album (Title again) */}
                <div className="flex-1 hidden md:block min-w-0 pr-4 text-slate-500 dark:text-slate-400 text-sm truncate font-medium">
                  {release.title}
                </div>

                {/* 4.5 Language */}
                <div className="w-24 hidden lg:block pr-4 text-slate-500 dark:text-slate-400 text-sm truncate font-medium">
                  {release.language || 'N/A'}
                </div>

                {/* 5. Date */}
                <div className="w-28 hidden lg:block text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap font-medium">
                  {new Date(release.release_date).toLocaleDateString()}
                </div>

                <div className="w-32 hidden sm:flex justify-center pr-4">
                  <span className={`inline-flex justify-center w-28 flex-shrink-0 items-center gap-1.5 px-2 py-1 rounded-full text-[9px] uppercase tracking-wider font-bold border ${getStatusBadgeClass(release.status)}`}>
                    {getStatusIcon(release.status)}
                    <span className="truncate">{release.status.replace('_', ' ')}</span>
                  </span>
                </div>

                {/* 7. Actions */}
                <div className="w-24 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setViewReleaseId(release.id)}
                    className="text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors p-1"
                    title="View Release Details"
                  >
                    <Eye size={16} />
                  </button>
                  <Link
                    to={`/releases/${release.id}`}
                    className="text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors p-1"
                    title="Edit Release"
                  >
                    <Pencil size={16} />
                  </Link>
                  <button
                    onClick={() => handleDeleteRelease(release.id, release.title)}
                    className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                    title="Delete Release"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            
            {paginatedReleases.length === 0 && (
               <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm font-medium">
                 No releases found for this page.
               </div>
            )}
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-between border-t border-slate-200 dark:border-dark-border/40 pt-6 mt-8">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-dark-border/40 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none transition-all"
        >
          <ChevronLeft size={16} />
          <span className="text-sm font-medium">Previous</span>
        </button>
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Page {currentPage} of {totalPages || 1}
        </span>
        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage >= totalPages}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-dark-border/40 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none transition-all"
        >
          <span className="text-sm font-medium">Next</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Release Details Modal */}
      <ReleaseDetailsModal
        isOpen={viewReleaseId !== null}
        onClose={() => setViewReleaseId(null)}
        releaseId={viewReleaseId}
      />

      {/* Sticky Audio Player */}
      {currentPlayingTrack && (
        <div className="fixed bottom-0 left-0 right-0 md:left-auto md:right-6 md:bottom-6 md:w-96 md:rounded-2xl bg-white/95 dark:bg-dark-card/95 backdrop-blur-md border border-slate-200 dark:border-dark-border/60 p-4 flex items-center justify-between z-50 shadow-soft-lg transition-all duration-300">
          <audio
            ref={audioRef}
            src={currentPlayingTrack.url}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          <div className="flex items-center gap-3 overflow-hidden mr-4">
            <div className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-200/50 dark:border-dark-border/40">
              {currentPlayingTrack.artwork ? (
                <img src={currentPlayingTrack.artwork} alt={currentPlayingTrack.releaseTitle} className="h-full w-full object-cover" />
              ) : (
                <Disc className="h-6 w-6 text-slate-400 m-3" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{currentPlayingTrack.title}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{currentPlayingTrack.releaseTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="h-10 w-10 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20 active:scale-95 transition-transform"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            </button>
            <button
              onClick={() => setCurrentPlayingTrack(null)}
              className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center active:scale-95 transition-transform text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
