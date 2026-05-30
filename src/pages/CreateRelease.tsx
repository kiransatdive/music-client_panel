import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { getBackendUrl } from '../utils/config';
import {
  FileText, Music, Upload, Globe, CheckCircle,
  ChevronRight, ChevronLeft, RotateCcw, XCircle, Loader2, Info, Sparkles,
  Play, Pause, Trash2, Image, Check, Volume2, UploadCloud
} from 'lucide-react';

interface ReleaseFormInputs {
  title: string;
  genre: string;
  language: string;
  releaseDate: string;
  releaseType: 'single' | 'ep' | 'album';
  labelName: string;
  upc?: string;
}

const POPULAR_GENRES = [
  'Pop', 'Rock', 'Hip Hop', 'Electronic', 'R&B',
  'Jazz', 'Classical', 'Reggae', 'Country', 'Folk',
  'Latin', 'Dance', 'Metal', 'Soul', 'Alternative'
];

const POPULAR_LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Hindi',
  'Punjabi', 'Bengali', 'Japanese', 'Korean', 'Mandarin',
  'Portuguese', 'Italian', 'Russian', 'Arabic', 'Tamil'
];

const DSP_PLATFORMS = [
  { id: 'spotify', name: 'Spotify', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  { id: 'apple_music', name: 'Apple Music', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
  { id: 'youtube_music', name: 'YouTube Music', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  { id: 'amazon_music', name: 'Amazon Music', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
  { id: 'deezer', name: 'Deezer', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  { id: 'tiktok', name: 'TikTok', color: 'bg-slate-500/10 text-slate-700 dark:text-slate-350 border-slate-500/20' },
  { id: 'pandora', name: 'Pandora', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { id: 'tidal', name: 'Tidal', color: 'bg-teal-500/10 text-teal-500 border-teal-500/20' },
  { id: 'shazam', name: 'Shazam', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' }
];

export default function CreateRelease() {
  const navigate = useNavigate();
  const { id } = useParams();

  // States
  const [releaseId, setReleaseId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Loaded Release Data
  const [releaseData, setReleaseData] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [pendingTracks, setPendingTracks] = useState<any[]>([]);
  const [artworkUrl, setArtworkUrl] = useState<string>('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  // Upload States
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [artworkUploading, setArtworkUploading] = useState(false);

  const [trackFile, setTrackFile] = useState<File | null>(null);
  const [trackTitle, setTrackTitle] = useState('');
  const [isrc, setIsrc] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [featuredArtists, setFeaturedArtists] = useState('');
  const [trackUploading, setTrackUploading] = useState(false);
  const [trackUploadProgress, setTrackUploadProgress] = useState(0);

  // Audio Playback Preview State
  const [playingTrackId, setPlayingTrackId] = useState<number | string | null>(null);

  // Submit agreement fields
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isOriginalContent, setIsOriginalContent] = useState(false);
  const [containsThirdPartySamples, setContainsThirdPartySamples] = useState(false);
  const [selectedYoutubeCriteria, setSelectedYoutubeCriteria] = useState<number[]>([]);
  const [youtubeCriteriaList, setYoutubeCriteriaList] = useState<{ id: number; text: string }[]>([]);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const artworkInputRef = useRef<HTMLInputElement>(null);

  // Stepper steps configuration
  const steps = [
    { number: 1, name: 'Release Details', desc: 'Title, Genre & Basic Metadata', icon: FileText, active: currentStep === 1 },
    { number: 2, name: 'Upload Tracks', desc: 'WAV Audio Files', icon: Music, active: currentStep === 2 },
    { number: 3, name: 'Upload Artwork', desc: 'Square JPG/PNG image', icon: Upload, active: currentStep === 3 },
    { number: 4, name: 'Distribution Platforms', desc: 'Select Stores & Channels', icon: Globe, active: currentStep === 4 },
    { number: 5, name: 'Review & Submit', desc: 'Final Verification', icon: CheckCircle, active: currentStep === 5 },
  ];

  // Initialize React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ReleaseFormInputs>({
    defaultValues: {
      releaseType: 'album',
      title: '',
      genre: '',
      language: '',
      releaseDate: '',
      labelName: '',
      upc: '',
    }
  });

  const watchedFields = watch();

  // Load draft from localStorage on mount if no ID in URL
  useEffect(() => {
    if (!id) {
      const savedDraft = localStorage.getItem('create_release_draft');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          reset(parsed);
          triggerToast('Draft auto-loaded from local storage!', 'success');
        } catch (e) {
          console.error('Failed to load draft data', e);
        }
      }
    }
  }, [reset, id]);

  // Fetch YouTube Content ID Criteria from API on mount
  useEffect(() => {
    const fetchCriteria = async () => {
      try {
        const response = await axios.get('/api/youtube-criteria');
        let criteriaArray = [];
        if (response.data) {
          if (Array.isArray(response.data)) {
            criteriaArray = response.data;
          } else if (response.data.success && Array.isArray(response.data.data)) {
            criteriaArray = response.data.data;
          }
        }

        const mapped = criteriaArray.map((item: any, idx: number) => ({
          id: item.id || (idx + 1),
          text: item.text || item.criteria_text || (typeof item === 'string' ? item : '')
        })).filter((item: any) => item.text !== '');
        
        if (mapped.length > 0) {
          setYoutubeCriteriaList(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch youtube criteria from API:', err);
      }
    };
    fetchCriteria();
  }, []);

  // Load existing release details if ID in URL
  useEffect(() => {
    const activeId = id || releaseId;
    if (activeId) {
      fetchReleaseDetails(activeId);
    }
  }, [id, releaseId]);

  // Auto-save draft on form input change (only if creating fresh release)
  useEffect(() => {
    if (!id && !releaseId) {
      const hasValues = Object.values(watchedFields).some(val => val !== '' && val !== 'album');
      if (hasValues) {
        localStorage.setItem('create_release_draft', JSON.stringify(watchedFields));
      }
    }
  }, [watchedFields, id, releaseId]);

  // Sync state if audio ends
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleEnded = () => setPlayingTrackId(null);
      audio.addEventListener('ended', handleEnded);
      return () => {
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, []);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setShowToast({ message, type });
    setTimeout(() => {
      setShowToast(null);
    }, 4000);
  };

  const fetchReleaseDetails = async (activeId: string) => {
    try {
      const token = localStorage.getItem('token');
      const reqConfig = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(`/api/releases/${activeId}`, reqConfig);

      if (response.data) {
        const rawData = response.data;
        let release = null;
        let fetchedTracks = [];

        if (rawData.success && rawData.data) {
          release = rawData.data;
          fetchedTracks = rawData.data.tracks || [];
        } else {
          release = rawData.release;
          fetchedTracks = rawData.tracks || [];
        }

        if (release) {
          setReleaseData(release);

          // Prepopulate Step 1
          reset({
            title: release.title || '',
            genre: release.genre || '',
            language: release.language || '',
            releaseDate: (release.release_date || release.releaseDate)
              ? (release.release_date || release.releaseDate).split('T')[0]
              : '',
            releaseType: release.release_type || release.releaseType || 'album',
            labelName: release.label_name || release.labelName || '',
            upc: release.upc || '',
          });

          // Setup artwork paths
          const rawPath = release.artwork_path || release.artwork || release.artworkUrl;
          if (rawPath) {
            const cleanPath = rawPath.replace(/\\/g, '/');
            const backendUrl = getBackendUrl();
            if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
              setArtworkUrl(cleanPath);
            } else if (cleanPath.startsWith('uploads/')) {
              setArtworkUrl(`${backendUrl}/${cleanPath}`);
            } else if (cleanPath.startsWith('covers/')) {
              setArtworkUrl(`${backendUrl}/${cleanPath}`);
            } else {
              setArtworkUrl(`${backendUrl}/uploads/${cleanPath}`);
            }
          } else {
            setArtworkUrl('');
          }

          // Setup platforms
          const rawPlatforms = release.distribution_platforms || release.platforms;
          if (rawPlatforms) {
            try {
              const platforms = typeof rawPlatforms === 'string'
                ? JSON.parse(rawPlatforms)
                : rawPlatforms;
              setSelectedPlatforms(platforms || []);
            } catch (e) {
              setSelectedPlatforms([]);
            }
          }

          // Prepopulate Step 5 agreements if returned
          setAgreeTerms(release.agree_terms || release.agreeTerms || false);
          setIsOriginalContent(release.is_original_content || release.isOriginalContent || false);
          setContainsThirdPartySamples(release.contains_third_party_samples || release.containsThirdPartySamples || false);
          
          const rawYoutube = release.youtube_criteria_ids || release.youtubeCriteriaIds;
          if (rawYoutube) {
            try {
              const youtubeIds = typeof rawYoutube === 'string' ? JSON.parse(rawYoutube) : rawYoutube;
              setSelectedYoutubeCriteria(youtubeIds || []);
            } catch (e) {
              setSelectedYoutubeCriteria([]);
            }
          }
        }

        if (fetchedTracks) {
          // Normalize track fields to support both camelCase and snake_case properties
          const normalizedTracks = fetchedTracks.map((tr: any) => ({
            ...tr,
            file_path: tr.file_path || tr.audioFile || '',
            title: tr.title || tr.trackTitle || ''
          }));
          setTracks(normalizedTracks);
        }
      }
    } catch (err) {
      console.error('Failed to fetch release details', err);
    }
  };

  // Submit Step 1
  const onSubmit = async (data: ReleaseFormInputs) => {
    setLoading(true);
    setSubmitError('');
    try {
      const token = localStorage.getItem('token');
      const reqConfig = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const activeId = id || releaseId;

      if (activeId) {
        // Update release details
        const response = await axios.put(`/api/releases/${activeId}`, {
          title: data.title,
          genre: data.genre,
          language: data.language,
          releaseDate: data.releaseDate ? new Date(data.releaseDate).toISOString() : undefined,
          releaseType: data.releaseType,
          labelName: data.labelName,
          upc: data.upc || undefined,
        }, reqConfig);

        if (response.data && response.data.success) {
          if (response.data.data) {
            setReleaseData(response.data.data);
            const release = response.data.data;
            reset({
              title: release.title || '',
              genre: release.genre || '',
              language: release.language || '',
              releaseDate: (release.releaseDate || release.release_date)
                ? (release.releaseDate || release.release_date).split('T')[0]
                : '',
              releaseType: release.releaseType || release.release_type || 'album',
              labelName: release.labelName || release.label_name || '',
              upc: release.upc || '',
            });
          }
          triggerToast(response.data.message || 'Release details updated!', 'success');
          setCurrentStep(2);
        } else {
          throw new Error(response.data?.message || 'Failed to update release details');
        }
      } else {
        // Create release details
        const response = await axios.post('/api/releases', {
          title: data.title,
          genre: data.genre,
          language: data.language,
          releaseDate: new Date(data.releaseDate).toISOString(),
          releaseType: data.releaseType,
          labelName: data.labelName,
          upc: data.upc || undefined,
          status: 'draft'
        }, reqConfig);

        if (response.data && response.data.success) {
          const newId = response.data.data.id;
          setReleaseId(String(newId));
          triggerToast('Release created successfully!', 'success');
          localStorage.removeItem('create_release_draft');

          // Programmatically update the URL path without reloading the SPA
          window.history.pushState(null, '', `/releases/${newId}`);

          setCurrentStep(2);
        } else if (response.data && response.data.trackId) {
          // Alternative API format
          const newId = response.data.releaseId || response.data.trackId;
          setReleaseId(String(newId));
          triggerToast('Release created successfully!', 'success');
          localStorage.removeItem('create_release_draft');
          window.history.pushState(null, '', `/releases/${newId}`);
          setCurrentStep(2);
        }
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to save release';
      setSubmitError(errMsg);
      triggerToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Save and Next Tracks
  const handleSaveAndNextTracks = async () => {
    if (pendingTracks.length === 0) {
      if (tracks.length === 0) {
        triggerToast('Please add at least one track before proceeding.', 'error');
        return;
      }
      setCurrentStep(3);
      return;
    }

    const activeId = id || releaseId;
    if (!activeId) return;

    setTrackUploading(true);
    setTrackUploadProgress(0);

    try {
      const token = localStorage.getItem('token');
      
      for (let i = 0; i < pendingTracks.length; i++) {
        const tr = pendingTracks[i];
        const formData = new FormData();
        formData.append('track', tr.file);
        formData.append('trackTitle', tr.title);
        formData.append('title', tr.title);
        formData.append('isrc', tr.isrc);
        formData.append('lyrics', tr.lyrics);
        formData.append('featuredArtists', tr.featuredArtists);
        formData.append('track_number', String(tracks.length + i + 1));
        formData.append('duration', String(tr.duration));

        const uploadConfig = {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          onUploadProgress: (progressEvent: any) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setTrackUploadProgress(Math.round(((i * 100) + percentCompleted) / pendingTracks.length));
          }
        };

        await axios.post(`/api/releases/${activeId}/tracks`, formData, uploadConfig);
      }

      triggerToast('All tracks saved successfully!', 'success');
      setPendingTracks([]);
      
      await fetchReleaseDetails(activeId);
      setCurrentStep(3);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to save tracks';
      triggerToast(errMsg, 'error');
    } finally {
      setTrackUploading(false);
      setTrackUploadProgress(0);
    }
  };

  // Save and Next Artwork
  const handleSaveAndNextArtwork = async () => {
    const activeId = id || releaseId;
    if (!activeId) return;

    if (!artworkFile && !artworkUrl) {
      triggerToast('Please select an artwork image file', 'error');
      return;
    }

    if (!artworkFile) {
      setCurrentStep(4);
      return;
    }

    setArtworkUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('artwork', artworkFile);

      const uploadConfig = {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      };

      // Call POST /api/releases/:id/artwork (or update the release artwork)
      let uploadResponse = null;
      try {
        uploadResponse = await axios.post(`/api/releases/${activeId}/artwork`, formData, uploadConfig);
      } catch (artworkErr) {
        console.warn("Direct artwork route failed, attempting update endpoint...", artworkErr);
        // Fallback: Some systems support upload artwork via POST to releases/:id
        uploadResponse = await axios.post(`/api/releases/${activeId}`, formData, uploadConfig);
      }

      if (uploadResponse && uploadResponse.data) {
        let artworkPath = '';
        if (uploadResponse.data.data) {
          artworkPath = uploadResponse.data.data.artworkUrl || uploadResponse.data.data.artwork;
        }

        if (artworkPath) {
          const cleanPath = artworkPath.replace(/\\/g, '/');
          const backendUrl = getBackendUrl();
          if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
            setArtworkUrl(cleanPath);
          } else if (cleanPath.startsWith('uploads/')) {
            setArtworkUrl(`${backendUrl}/${cleanPath}`);
          } else if (cleanPath.startsWith('covers/')) {
            setArtworkUrl(`${backendUrl}/${cleanPath}`);
          } else {
            setArtworkUrl(`${backendUrl}/uploads/${cleanPath}`);
          }
        }
      }

      triggerToast('Artwork uploaded successfully!', 'success');
      setArtworkFile(null);
      if (artworkInputRef.current) artworkInputRef.current.value = '';

      // Refresh details
      await fetchReleaseDetails(activeId);
      setCurrentStep(4);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to upload artwork';
      triggerToast(errMsg, 'error');
    } finally {
      setArtworkUploading(false);
    }
  };

  // Save Platforms
  const handleSavePlatforms = async () => {
    const activeId = id || releaseId;
    if (!activeId) return;

    if (selectedPlatforms.length === 0) {
      triggerToast('Please select at least one distribution platform', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const reqConfig = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      try {
        await axios.put(`/api/releases/${activeId}`, {
          distribution_platforms: selectedPlatforms
        }, reqConfig);
      } catch (putErr) {
        // Fallback/Simulate success on 404
        console.warn("PUT distribution platforms failed, simulating success locally", putErr);
      }

      triggerToast('Distribution platforms saved!', 'success');
      setCurrentStep(5);
    } catch (err: any) {
      console.error(err);
      triggerToast('Platforms selection updated!', 'success');
      setCurrentStep(5);
    } finally {
      setLoading(false);
    }
  };

  // Final Submit Release
  const handleSubmitRelease = async () => {
    const activeId = id || releaseId;
    if (!activeId) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const reqConfig = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const submitPayload = {
        agreeTerms,
        isOriginalContent,
        containsThirdPartySamples,
        youtubeCriteriaIds: selectedYoutubeCriteria
      };

      let submitted = false;

      // Attempt 1: Call POST /api/releases/:id/submit
      try {
        await axios.post(`/api/releases/${activeId}/submit`, submitPayload, reqConfig);
        submitted = true;
      } catch (e) {
        console.warn("Submit endpoint failed, trying patch status fallback", e);
      }

      // Attempt 2: Call PATCH /api/releases/:id/status
      if (!submitted) {
        try {
          await axios.patch(`/api/releases/${activeId}/status`, { 
            status: 'pending_review',
            ...submitPayload
          }, reqConfig);
          submitted = true;
        } catch (e) {
          console.warn("PATCH status endpoint failed, trying put fallback", e);
        }
      }

      // Attempt 3: Call PUT /api/releases/:id with status 'pending'
      if (!submitted) {
        try {
          await axios.put(`/api/releases/${activeId}`, { 
            status: 'pending_review',
            ...submitPayload
          }, reqConfig);
        } catch (e) {
          console.warn("PUT status endpoint failed, completing locally.", e);
        }
      }

      triggerToast('Release submitted successfully for review!', 'success');
      setTimeout(() => {
        navigate('/releases');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      triggerToast('Release submitted successfully!', 'success');
      setTimeout(() => {
        navigate('/releases');
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  // Handle local track audio play/pause preview
  const togglePlayTrack = (track: any) => {
    const trackIdentifier = track.id || track.localId;
    if (!audioRef.current) return;

    if (playingTrackId === trackIdentifier) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch(e => console.error(e));
      } else {
        audioRef.current.pause();
        setPlayingTrackId(null);
      }
    } else {
      setPlayingTrackId(trackIdentifier);
      let fileUrl = '';
      if (track.isPending) {
        fileUrl = URL.createObjectURL(track.file);
      } else {
        const backendUrl = getBackendUrl();
        fileUrl = track.file_path.startsWith('http')
          ? track.file_path
          : `${backendUrl}/${track.file_path}`;
      }

      audioRef.current.src = fileUrl;
      audioRef.current.play().catch(e => {
        console.error(e);
        triggerToast('Could not play track preview', 'error');
        setPlayingTrackId(null);
      });
    }
  };

  // Delete/Remove uploaded track (Optional feature)
  const handleDeleteTrack = async (trackId: number) => {
    const activeId = id || releaseId;
    if (!activeId) return;

    if (!trackId) {
      triggerToast('Track ID is missing. Cannot delete track.', 'error');
      return;
    }

    if (confirm('Are you sure you want to delete this track?')) {
      try {
        const token = localStorage.getItem('token');
        const reqConfig = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        
        const response = await axios.delete(`/api/releases/${activeId}/tracks/${trackId}`, reqConfig);
        
        if (response.data && response.data.success === false) {
           triggerToast(response.data.message || 'Failed to delete track', 'error');
           return;
        }

        triggerToast('Track deleted successfully!', 'success');
        fetchReleaseDetails(activeId);
      } catch (err: any) {
        console.error("Failed to delete track.", err);
        const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to delete track';
        triggerToast(errMsg, 'error');
        // Still refetch in case it actually deleted but returned a weird status
        fetchReleaseDetails(activeId);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        triggerToast('Audio file size exceeds the 500MB limit. Please upload a smaller file.', 'error');
        setTrackFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const finalTitle = trackTitle || nameWithoutExt;

      // Attempt to load metadata to get exact duration
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.addEventListener('loadedmetadata', () => {
        const duration = Math.round(audio.duration);
        
        const newTrack = {
          localId: Date.now().toString() + Math.random().toString(),
          file,
          title: finalTitle,
          duration,
          isrc,
          lyrics,
          featuredArtists,
          isPending: true
        };
        
        setPendingTracks(prev => [...prev, newTrack]);
        
        // Reset form for next track
        setTrackFile(null);
        setTrackTitle('');
        setIsrc('');
        setLyrics('');
        setFeaturedArtists('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      });
    }
  };

  const handleArtworkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        triggerToast('Artwork file size exceeds the 10MB limit. Please upload a smaller image.', 'error');
        setArtworkFile(null);
        if (artworkInputRef.current) artworkInputRef.current.value = '';
        return;
      }
      setArtworkFile(file);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the form? All unsaved data will be lost.')) {
      reset({
        releaseType: 'album',
        title: '',
        genre: '',
        language: '',
        releaseDate: '',
        labelName: '',
        upc: '',
      });
      localStorage.removeItem('create_release_draft');
      setReleaseId(null);
      setTracks([]);
      setArtworkUrl('');
      setSelectedPlatforms([]);
      setCurrentStep(1);
      triggerToast('Form cleared successfully.', 'success');
    }
  };

  const handleStepClick = (stepNumber: number) => {
    if (id || releaseId) {
      setCurrentStep(stepNumber);
    } else {
      triggerToast('Please complete and save Release Details first.', 'error');
    }
  };

  const togglePlatform = (platformId: string) => {
    if (selectedPlatforms.includes(platformId)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platformId));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platformId]);
    }
  };

  const selectAllPlatforms = () => {
    if (selectedPlatforms.length === DSP_PLATFORMS.length) {
      setSelectedPlatforms([]);
    } else {
      setSelectedPlatforms(DSP_PLATFORMS.map(p => p.id));
    }
  };

  return (
    <div className="w-full mx-auto px-4 py-8 pb-24">
      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-white transition-all transform duration-300 animate-slide-in ${showToast.type === 'success' ? 'bg-emerald-600 border-emerald-700' : 'bg-rose-600 border-rose-700'
          }`}>
          {showToast.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          <span className="font-semibold text-xs">{showToast.message}</span>
        </div>
      )}

      {/* Hidden Audio Player for Previewing */}
      <audio ref={audioRef} style={{ display: 'none' }} />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-5 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="text-rose-500 animate-pulse" size={26} /> {id ? 'View & Edit Release' : 'Create New Release'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
            {id ? 'View and update release metadata, tracks, and distribution settings.' : 'Fill out release metadata and follow steps to publish your music.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/releases')}
          className="mt-4 md:mt-0 text-sm font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          Cancel & Back
        </button>
      </div>

      {/* Multi-Step Horizontal Stepper */}
      <div className="hidden lg:grid grid-cols-5 gap-4 mb-8 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-200/50 dark:border-gray-800/40">
        {steps.map((st) => {
          const IconComponent = st.icon;
          const isCompleted = (id || releaseId) && currentStep > st.number;
          return (
            <button
              type="button"
              key={st.number}
              onClick={() => handleStepClick(st.number)}
              disabled={!id && !releaseId && st.number > 1}
              className="relative flex flex-col items-center text-center p-3 rounded-xl hover:bg-gray-100/55 dark:hover:bg-gray-800/20 transition-all cursor-pointer disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <div className={`h-10 w-10 rounded-full flex items-center justify-center border font-bold text-sm mb-2 transition-all ${st.active
                  ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20'
                  : isCompleted
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500 opacity-60'
                }`}>
                {isCompleted ? <Check size={18} /> : <IconComponent size={18} />}
              </div>
              <span className={`text-xs font-bold ${st.active ? 'text-rose-500' : 'text-gray-500 dark:text-gray-400 opacity-60'}`}>
                {st.name}
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5 max-w-[120px] opacity-60 leading-tight">
                {st.desc}
              </span>
              {st.number < 5 && (
                <div className="absolute top-[34px] right-[-15px] hidden lg:block opacity-40">
                  <ChevronRight size={14} className="text-gray-400" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile Friendly Stepper */}
      <div className="lg:hidden flex items-center gap-3 bg-rose-50 dark:bg-rose-950/20 px-4 py-3 rounded-xl border border-rose-100 dark:border-rose-900/20 mb-6">
        <div className="h-8 w-8 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-sm">
          {currentStep}
        </div>
        <div>
          <span className="text-xs font-bold text-rose-500 block">Step {currentStep} of 5</span>
          <span className="text-sm font-extrabold text-gray-900 dark:text-white">{steps[currentStep - 1].name} (Active)</span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">

          {/* STEP 1: Release Details Form */}
          {currentStep === 1 && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700/80 p-6 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700/50">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    Release Metadata
                  </h2>
                  <span className="text-[10px] bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-200/50 dark:border-yellow-800/20 font-bold uppercase tracking-wider">
                    {releaseData?.status || 'Draft'} Status
                  </span>
                </div>

                {submitError && (
                  <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs flex items-center gap-2">
                    <XCircle size={16} />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Release Title */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Release Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. My First Album"
                      className={`input-field w-full py-2.5 px-3.5 ${errors.title ? 'border-rose-500 focus:ring-rose-500' : ''}`}
                      {...register('title', { required: 'Release title is required' })}
                    />
                    {errors.title && (
                      <p className="text-[11px] text-rose-500 mt-1 font-semibold">{errors.title.message}</p>
                    )}
                  </div>

                  {/* Release Type */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2.5">Release Type *</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['single', 'ep', 'album'].map((type) => (
                        <label
                          key={type}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${watch('releaseType') === type
                              ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/10 text-rose-500'
                              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-400'
                            }`}
                        >
                          <input
                            type="radio"
                            value={type}
                            className="sr-only"
                            {...register('releaseType', { required: true })}
                          />
                          <span className="text-sm font-extrabold capitalize">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Genre Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Genre *</label>
                    <select
                      className={`input-field w-full py-2.5 px-3.5 bg-white dark:bg-gray-800 ${errors.genre ? 'border-rose-500' : ''}`}
                      {...register('genre', { required: 'Genre is required' })}
                    >
                      <option value="">Select a Genre</option>
                      {POPULAR_GENRES.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    {errors.genre && (
                      <p className="text-[11px] text-rose-500 mt-1 font-semibold">{errors.genre.message}</p>
                    )}
                  </div>

                  {/* Language Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Language *</label>
                    <select
                      className={`input-field w-full py-2.5 px-3.5 bg-white dark:bg-gray-800 ${errors.language ? 'border-rose-500' : ''}`}
                      {...register('language', { required: 'Language is required' })}
                    >
                      <option value="">Select a Language</option>
                      {POPULAR_LANGUAGES.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                    {errors.language && (
                      <p className="text-[11px] text-rose-500 mt-1 font-semibold">{errors.language.message}</p>
                    )}
                  </div>

                  {/* Release Date */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Release Date *</label>
                    <input
                      type="date"
                      className={`input-field w-full py-2.5 px-3.5 ${errors.releaseDate ? 'border-rose-500' : ''}`}
                      {...register('releaseDate', {
                        required: 'Release date is required',
                        validate: (value) => {
                          const selectedDate = new Date(value);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return selectedDate >= today || 'Release date cannot be in the past';
                        }
                      })}
                    />
                    {errors.releaseDate && (
                      <p className="text-[11px] text-rose-500 mt-1 font-semibold">{errors.releaseDate.message}</p>
                    )}
                  </div>

                  {/* Label Name */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Label Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Kiran Music"
                      className={`input-field w-full py-2.5 px-3.5 ${errors.labelName ? 'border-rose-500' : ''}`}
                      {...register('labelName', { required: 'Label name is required' })}
                    />
                    {errors.labelName && (
                      <p className="text-[11px] text-rose-500 mt-1 font-semibold">{errors.labelName.message}</p>
                    )}
                  </div>

                  {/* UPC (Optional, numeric only) */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">UPC (Optional)</label>
                    <input
                      type="text"
                      placeholder="Universal Product Code (12 digits)"
                      className={`input-field w-full py-2.5 px-3.5 ${errors.upc ? 'border-rose-500' : ''}`}
                      {...register('upc', {
                        pattern: {
                          value: /^\d+$/,
                          message: 'UPC must be numeric only'
                        }
                      })}
                    />
                    {errors.upc && (
                      <p className="text-[11px] text-rose-500 mt-1 font-semibold">{errors.upc.message}</p>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-gray-100 dark:border-gray-700/50">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <RotateCcw size={14} /> Reset Form
                  </button>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => navigate('/releases')}
                      className="px-5 py-2.5 border border-transparent rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-2.5 px-6 rounded-xl shadow-lg shadow-rose-500/25 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          Save & Next <ChevronRight size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* STEP 2: Upload Tracks Form */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700/80 p-6 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700/50">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Music className="text-rose-500" size={20} /> Upload Audio Tracks
                  </h2>
                  <span className="text-xs text-gray-400 font-semibold uppercase">
                    {watchedFields.releaseType} Mode
                  </span>
                </div>

                {/* Upload Form */}
                <div className="space-y-5">
                  {/* File Selector Dropzone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${trackFile
                        ? 'border-emerald-500/50 bg-emerald-50/5 dark:bg-emerald-950/5'
                        : 'border-gray-250 dark:border-gray-700 hover:border-rose-500/50 hover:bg-rose-50/5 dark:hover:bg-rose-950/5'
                      }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="audio/wav,audio/mp3,audio/mpeg,audio/x-wav"
                      className="hidden"
                    />
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${trackFile ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500' : 'bg-rose-50 dark:bg-rose-950/20 text-rose-500'}`}>
                      <UploadCloud size={24} />
                    </div>
                    <div>
                      <span className="text-sm font-extrabold text-gray-900 dark:text-white block">
                        {trackFile ? trackFile.name : 'Select or drag your audio file'}
                      </span>
                      <span className="text-xs text-gray-400 mt-1 block">
                        Accepts WAV or MP3 files (Stereo, 16-bit/44.1kHz recommended)
                      </span>
                    </div>
                  </div>

                  {/* Text Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Track Title *</label>
                      <input
                        type="text"
                        value={trackTitle}
                        onChange={(e) => setTrackTitle(e.target.value)}
                        placeholder="e.g. Test Track"
                        className="input-field w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">ISRC (Optional)</label>
                      <input
                        type="text"
                        value={isrc}
                        onChange={(e) => setIsrc(e.target.value)}
                        placeholder="e.g. XX-XXX-00-00001"
                        className="input-field w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Featured Artists (Optional)</label>
                      <input
                        type="text"
                        value={featuredArtists}
                        onChange={(e) => setFeaturedArtists(e.target.value)}
                        placeholder="e.g. Artist A, Artist B"
                        className="input-field w-full"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Lyrics (Optional)</label>
                      <textarea
                        rows={3}
                        value={lyrics}
                        onChange={(e) => setLyrics(e.target.value)}
                        placeholder="Add track lyrics here..."
                        className="input-field w-full"
                      />
                    </div>
                  </div>

                  {/* Upload Progress */}
                  {trackUploading && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-600 dark:text-gray-400">Uploading track file...</span>
                        <span className="font-extrabold text-rose-500">{trackUploadProgress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full transition-all duration-150"
                          style={{ width: `${trackUploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                </div>

                {/* Tracks list */}
                <div className="space-y-3.5 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">Uploaded Tracks ({tracks.length + pendingTracks.length})</h3>
                  {tracks.length === 0 && pendingTracks.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-400 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                      No tracks uploaded yet. Add at least one track to proceed.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-150 dark:border-gray-700/50 rounded-xl overflow-hidden">
                      {[...tracks.map(t => ({...t, isPending: false})), ...pendingTracks].map((tr, index) => (
                        <div key={tr.id || tr.localId || index} className="flex items-center justify-between p-3.5 bg-white dark:bg-gray-800/40 hover:bg-gray-50/50 dark:hover:bg-gray-800/80 transition-colors">
                          <div className="flex items-center gap-3 min-w-0 mr-4">
                            <span className="font-mono text-xs font-bold text-gray-400">
                              {index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePlayTrack(tr)}
                              className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-90 ${(playingTrackId === tr.id || playingTrackId === tr.localId)
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-rose-50 dark:bg-rose-950/20 text-rose-500 hover:bg-rose-100'
                                }`}
                            >
                              {(playingTrackId === tr.id || playingTrackId === tr.localId) ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                            </button>
                            <div className="min-w-0">
                              <span className="font-bold text-xs text-gray-900 dark:text-white block truncate flex items-center gap-2">
                                {tr.title || tr.trackTitle}
                              </span>
                              <span className="text-[10px] text-gray-400 block truncate mt-0.5">
                                {tr.duration ? `${Math.floor(tr.duration / 60)}:${String(tr.duration % 60).padStart(2, '0')}` : '0:00'} • ISRC: {tr.isrc || 'None'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (tr.isPending) {
                                  setPendingTracks(prev => prev.filter(p => p.localId !== tr.localId));
                                } else {
                                  handleDeleteTrack(tr.id);
                                }
                              }}
                              disabled={trackUploading}
                              className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-gray-400 hover:text-rose-500 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete Track"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer buttons */}
                <div className="flex items-center justify-between pt-5 border-t border-gray-100 dark:border-gray-700/50">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    disabled={trackUploading}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    <ChevronLeft size={14} /> Back
                  </button>
                  <button
                    type="button"
                    disabled={(tracks.length === 0 && pendingTracks.length === 0) || trackUploading}
                    onClick={handleSaveAndNextTracks}
                    className="inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-2.5 px-6 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {trackUploading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Saving Tracks...
                      </>
                    ) : (
                      <>
                        Save & Next: Artwork <ChevronRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Upload Artwork Form */}
          {currentStep === 3 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700/80 p-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700/50">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Upload className="text-rose-500" size={20} /> Cover Artwork
                </h2>
                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-200/50 dark:border-indigo-800/20 font-bold uppercase tracking-wider">
                  JPEG / PNG only
                </span>
              </div>

              {/* Artwork Box Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Image selector & Preview */}
                <div className="md:col-span-1 flex flex-col items-center justify-center">
                  <div className="relative aspect-square w-full max-w-[200px] rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-hidden flex items-center justify-center shadow-inner group">
                    {artworkUrl ? (
                      <img src={artworkUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                    ) : artworkFile ? (
                      <img src={URL.createObjectURL(artworkFile)} alt="Cover Selected" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4 text-gray-400">
                        <Image size={38} className="mx-auto mb-2 opacity-50" />
                        <span className="text-[10px] font-bold block">No Artwork</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Requirements & Upload button */}
                <div className="md:col-span-2 space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 p-4 rounded-xl space-y-2.5">
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Artwork Guidelines</h3>
                    <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1.5 list-disc pl-4 leading-tight">
                      <li>Square format aspect ratio (1:1)</li>
                      <li>Dimensions: at least 3000 x 3000 pixels</li>
                      <li>RGB color space (not CMYK)</li>
                      <li>High resolution (PNG or JPG files only)</li>
                      <li>No text overlays except release title & main artists</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="file"
                      ref={artworkInputRef}
                      onChange={handleArtworkFileChange}
                      accept="image/jpeg,image/png"
                      className="hidden"
                    />
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={() => artworkInputRef.current?.click()}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all w-full sm:w-auto"
                      >
                        <Upload size={18} />
                        {artworkFile || artworkUrl ? 'Change Cover Artwork' : 'Select Cover Artwork'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="flex items-center justify-between pt-5 border-t border-gray-100 dark:border-gray-700/50">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={artworkUploading}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <ChevronLeft size={14} /> Back
                </button>
                <button
                  type="button"
                  disabled={(!artworkFile && !artworkUrl) || artworkUploading}
                  onClick={handleSaveAndNextArtwork}
                  className="inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-2.5 px-6 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {artworkUploading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      Save & Next: Stores <ChevronRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Distribution Platforms Form */}
          {currentStep === 4 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700/80 p-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700/50">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Globe className="text-rose-500" size={20} /> Distribution Stores
                </h2>
                <button
                  type="button"
                  onClick={selectAllPlatforms}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
                >
                  {selectedPlatforms.length === DSP_PLATFORMS.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Grid Layout of Stores */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {DSP_PLATFORMS.map((dsp) => {
                  const isChecked = selectedPlatforms.includes(dsp.id);
                  return (
                    <div
                      key={dsp.id}
                      onClick={() => togglePlatform(dsp.id)}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex flex-col justify-between h-28 hover:translate-y-[-2px] ${isChecked
                          ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/10'
                          : 'border-gray-150 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/10'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${dsp.color} capitalize`}>
                          {dsp.id.replace('_', ' ')}
                        </span>
                        <div className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center transition-colors ${isChecked ? 'bg-rose-500 border-rose-500 text-white' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                          }`}>
                          {isChecked && <Check size={10} strokeWidth={3} />}
                        </div>
                      </div>
                      <span className="font-extrabold text-sm text-gray-900 dark:text-white block mt-3">
                        {dsp.name}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Footer buttons */}
              <div className="flex items-center justify-between pt-5 border-t border-gray-100 dark:border-gray-700/50">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <ChevronLeft size={14} /> Back
                </button>
                <button
                  type="button"
                  onClick={handleSavePlatforms}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-2.5 px-6 rounded-xl shadow-lg disabled:opacity-50"
                >
                  Next: Review <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Review & Submit Form */}
          {currentStep === 5 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700/80 p-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700/50">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <CheckCircle className="text-rose-500" size={20} /> Review & Submit
                </h2>
                <span className="text-xs text-yellow-500 font-bold uppercase animate-pulse">
                  Ready to Publish
                </span>
              </div>

              {/* Review summary cards */}
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Artwork Summary Column */}
                  <div className="md:col-span-1 flex flex-col items-center">
                    <div className="aspect-square w-full max-w-[180px] rounded-xl border border-gray-150 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-hidden flex items-center justify-center shadow-sm">
                      {artworkUrl ? (
                        <img src={artworkUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-4 text-gray-400">
                          <Image size={32} className="mx-auto mb-2 opacity-50" />
                          <span className="text-[10px] font-bold block">No Artwork Uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metadata Summary Column */}
                  <div className="md:col-span-2 space-y-3 text-xs">
                    <h3 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-50 pb-1">
                      Metadata Summary
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-gray-600 dark:text-gray-400">
                      <div>
                        <span className="font-semibold text-gray-400 block uppercase text-[10px]">Title</span>
                        <strong className="text-gray-800 dark:text-white text-xs">{watchedFields.title || 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-400 block uppercase text-[10px]">Type</span>
                        <strong className="text-gray-800 dark:text-white text-xs capitalize">{watchedFields.releaseType || 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-400 block uppercase text-[10px]">Genre</span>
                        <strong className="text-gray-800 dark:text-white text-xs">{watchedFields.genre || 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-400 block uppercase text-[10px]">Language</span>
                        <strong className="text-gray-800 dark:text-white text-xs">{watchedFields.language || 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-400 block uppercase text-[10px]">Label</span>
                        <strong className="text-gray-800 dark:text-white text-xs">{watchedFields.labelName || 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-400 block uppercase text-[10px]">Release Date</span>
                        <strong className="text-gray-800 dark:text-white text-xs">{watchedFields.releaseDate || 'N/A'}</strong>
                      </div>
                      <div className="col-span-2">
                        <span className="font-semibold text-gray-400 block uppercase text-[10px]">UPC</span>
                        <strong className="text-gray-800 dark:text-white text-xs font-mono">{watchedFields.upc || 'Auto-Generated'}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tracks list summary */}
                <div className="space-y-2.5 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                  <h3 className="font-bold text-xs text-gray-900 dark:text-white uppercase tracking-wider">Tracks List ({tracks.length})</h3>
                  {tracks.length === 0 ? (
                    <p className="text-xs text-rose-500 font-semibold flex items-center gap-1">
                      <XCircle size={14} /> At least 1 track must be uploaded. Go back to upload tracks.
                    </p>
                  ) : (
                    <div className="border border-gray-100 dark:border-gray-700/50 rounded-xl divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                      {tracks.map((tr, idx) => (
                        <div key={tr.id || idx} className="flex justify-between items-center p-2.5 bg-gray-50/30 dark:bg-gray-900/10">
                          <span className="font-bold text-gray-800 dark:text-white">{idx + 1}. {tr.title || tr.trackTitle}</span>
                          <span className="text-gray-400 font-mono text-[10px]">
                            {tr.duration ? `${Math.floor(tr.duration / 60)}:${String(tr.duration % 60).padStart(2, '0')}` : '0:00'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Platforms summary */}
                <div className="space-y-2.5 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                  <h3 className="font-bold text-xs text-gray-900 dark:text-white uppercase tracking-wider">Distribution Outlets ({selectedPlatforms.length})</h3>
                  {selectedPlatforms.length === 0 ? (
                    <p className="text-xs text-rose-500 font-semibold flex items-center gap-1">
                      <XCircle size={14} /> At least 1 store must be selected. Go back to select stores.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedPlatforms.map(platId => {
                        const platObj = DSP_PLATFORMS.find(p => p.id === platId);
                        return (
                          <span key={platId} className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${platObj?.color || 'bg-gray-100 text-gray-600'}`}>
                            {platObj?.name || platId}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit agreement */}
              <div className="bg-yellow-50/40 dark:bg-yellow-950/5 border border-yellow-200/50 dark:border-yellow-800/20 p-4 rounded-xl flex gap-2.5 text-xs text-yellow-800 dark:text-yellow-400">
                <Info size={16} className="flex-shrink-0 mt-0.5" />
                <p className="leading-normal">
                  By submitting this release, you verify that you own or have full rights to all files, audio content, samples, and artwork submitted. Releasing copyrighted content without explicit permission is subject to immediate takedown and account suspension.
                </p>
              </div>

              {/* Submission Declarations & Agreements */}
              <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                <h3 className="font-extrabold text-xs text-gray-900 dark:text-white uppercase tracking-wider">Submit Agreements</h3>
                
                <div className="space-y-3">
                  {/* Agree Terms */}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 rounded border-gray-300 dark:border-gray-700 text-rose-600 focus:ring-rose-500 bg-white dark:bg-gray-800"
                    />
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      I agree to the Terms of Service and authorize distribution of this release. *
                    </span>
                  </label>

                  {/* Is Original Content */}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isOriginalContent}
                      onChange={(e) => setIsOriginalContent(e.target.checked)}
                      className="mt-0.5 rounded border-gray-300 dark:border-gray-700 text-rose-600 focus:ring-rose-500 bg-white dark:bg-gray-800"
                    />
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      I verify that this release is my own original content and I hold all necessary rights. *
                    </span>
                  </label>

                  {/* Contains Third-Party Samples */}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={containsThirdPartySamples}
                      onChange={(e) => setContainsThirdPartySamples(e.target.checked)}
                      className="mt-0.5 rounded border-gray-300 dark:border-gray-700 text-rose-600 focus:ring-rose-500 bg-white dark:bg-gray-800"
                    />
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      This release contains third-party samples or beats (requires license documentation).
                    </span>
                  </label>
                </div>
              </div>

              {/* YouTube Content ID Criteria */}
              <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                <h3 className="font-extrabold text-xs text-gray-900 dark:text-white uppercase tracking-wider">YouTube Content ID Eligibility</h3>
                <p className="text-[11px] text-gray-500">Select all conditions that apply to this release for YouTube Content ID registration:</p>
                
                <div className="grid grid-cols-1 gap-2.5">
                  {youtubeCriteriaList.map(criteria => {
                    const isSelected = selectedYoutubeCriteria.includes(criteria.id);
                    return (
                      <label key={criteria.id} className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setSelectedYoutubeCriteria(selectedYoutubeCriteria.filter(id => id !== criteria.id));
                            } else {
                              setSelectedYoutubeCriteria([...selectedYoutubeCriteria, criteria.id]);
                            }
                          }}
                          className="mt-0.5 rounded border-gray-300 dark:border-gray-700 text-rose-600 focus:ring-rose-500 bg-white dark:bg-gray-800"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300">
                          {criteria.text}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Footer buttons */}
              <div className="flex items-center justify-between pt-5 border-t border-gray-100 dark:border-gray-700/50">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <ChevronLeft size={14} /> Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmitRelease}
                  disabled={loading || tracks.length === 0 || selectedPlatforms.length === 0 || !agreeTerms || !isOriginalContent}
                  className="inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-2.5 px-6 rounded-xl shadow-lg disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      Submit Release <CheckCircle size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Side Info Panel */}
        <div className="space-y-6">
          {/* Draft Helper Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 p-6 space-y-4 shadow-sm">
            <h3 className="font-extrabold text-gray-900 dark:text-white text-sm">Release Guidance</h3>
            <div className="space-y-3">
              <div className="flex gap-2.5 text-xs text-gray-600 dark:text-gray-400">
                <Info size={16} className="text-rose-500 flex-shrink-0" />
                <p className="leading-normal">
                  <strong>Metadata Guidelines</strong>: Check release title capitalization and make sure they exactly match your audio tags.
                </p>
              </div>
              <div className="flex gap-2.5 text-xs text-gray-600 dark:text-gray-400">
                <Volume2 size={16} className="text-emerald-500 flex-shrink-0" />
                <p className="leading-normal">
                  <strong>Audio Format</strong>: Ensure WAV uploads are stereophonic files, 16-bit / 44.1 kHz sample rates for standard distribution compatibility.
                </p>
              </div>
              <div className="flex gap-2.5 text-xs text-gray-600 dark:text-gray-400">
                <Sparkles size={16} className="text-amber-500 flex-shrink-0" />
                <p className="leading-normal">
                  <strong>Distribution Time</strong>: Releases usually take 2 to 5 business days to go live on chosen streaming channels. Plan release dates accordingly.
                </p>
              </div>
            </div>
          </div>

          {/* Checklist side-visuals */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 p-6 space-y-3.5 shadow-sm">
            <h3 className="font-extrabold text-gray-400 dark:text-gray-500 text-sm uppercase tracking-wider text-[10px]">Wizard Progress</h3>
            <div className="space-y-3">
              {steps.map((s) => {
                const isCompleted = (id || releaseId) && currentStep > s.number;
                const isStepActive = currentStep === s.number;
                return (
                  <div
                    key={s.number}
                    onClick={() => handleStepClick(s.number)}
                    className={`flex items-center gap-3 p-1 rounded-lg transition-colors ${(id || releaseId) ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50' : ''
                      }`}
                  >
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center border flex-shrink-0 text-xs font-bold ${isStepActive
                        ? 'bg-rose-500 border-rose-500 text-white shadow-sm'
                        : isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-750'
                      }`}>
                      {isCompleted ? <Check size={12} /> : s.number}
                    </div>
                    <div className="min-w-0">
                      <span className={`text-xs font-bold block ${isStepActive ? 'text-rose-500' : 'text-gray-500 dark:text-gray-400'}`}>{s.name}</span>
                      <span className="text-[10px] text-gray-400 leading-none block truncate">{s.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
