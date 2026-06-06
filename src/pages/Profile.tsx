import { useEffect, useState } from 'react';
import axios from 'axios';
import { getBackendUrl } from '../utils/config';
import { User, CheckCircle, Edit2, X, Save, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const parseSocialLinksToObj = (text: string): Record<string, string> => {
  const lines = text.split('\n');
  const obj: Record<string, string> = {};
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex !== -1) {
      const key = trimmed.substring(0, colonIndex).trim().toLowerCase();
      const val = trimmed.substring(colonIndex + 1).trim();
      if (key && val) {
        obj[key] = val;
        return;
      }
    }
    
    const lower = trimmed.toLowerCase();
    let platform = `link_${index + 1}`;
    if (lower.includes('instagram.com')) platform = 'instagram';
    else if (lower.includes('twitter.com') || lower.includes('x.com')) platform = 'twitter';
    else if (lower.includes('youtube.com')) platform = 'youtube';
    else if (lower.includes('facebook.com')) platform = 'facebook';
    else if (lower.includes('spotify.com')) platform = 'spotify';
    else if (lower.includes('soundcloud.com')) platform = 'soundcloud';
    
    obj[platform] = trimmed;
  });
  
  return obj;
};

const formatSocialLinksToString = (socialLinks: any): string => {
  if (!socialLinks) return '';
  if (typeof socialLinks === 'string') {
    try {
      const parsed = JSON.parse(socialLinks);
      if (typeof parsed === 'object' && parsed !== null) {
        return formatSocialLinksToString(parsed);
      }
    } catch (e) {
      return socialLinks;
    }
  }
  if (typeof socialLinks === 'object' && socialLinks !== null) {
    return Object.entries(socialLinks)
      .map(([platform, link]) => `${platform}: ${link}`)
      .join('\n');
  }
  return '';
};

export default function Profile() {
  const { fetchProfile } = useAuth();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [artistData, setArtistData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bio: '',
    genre: '',
    socialLinksText: '',
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    upiId: '',
    label: '',
  });

  useEffect(() => {
    loadArtistData();
  }, []);

  const loadArtistData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(`${getBackendUrl()}/api/artist/profile`, config);
      const artist = response.data?.data?.artist;
      if (artist) {
        setArtistData(artist);
        
        setFormData({
          name: artist.name || '',
          phone: artist.phone || '',
          bio: artist.bio || '',
          genre: artist.genre || '',
          socialLinksText: formatSocialLinksToString(artist.socialLinks),
          bankName: artist.bankName || '',
          accountHolderName: artist.accountHolderName || '',
          accountNumber: artist.accountNumber || '',
          ifscCode: artist.ifscCode || '',
          branchName: artist.branchName || '',
          upiId: artist.upiId || '',
          label: artist.label || '',
        });

        if (artist.profileImage) {
          const cleanPath = artist.profileImage.replace(/\\/g, '/');
          if (cleanPath.startsWith('http')) {
            setImagePreview(cleanPath);
          } else {
            const backendUrl = getBackendUrl();
            setImagePreview(`${backendUrl}/${cleanPath}`);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load full profile data", err);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setProfileImageFile(null);
    loadArtistData(); // Reset form to latest saved state
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('phone', formData.phone);
      submitData.append('bio', formData.bio);
      submitData.append('genre', formData.genre);
      submitData.append('label', formData.label);
      
      const socialLinksObj = parseSocialLinksToObj(formData.socialLinksText);
      submitData.append('socialLinks', JSON.stringify(socialLinksObj));
      
      submitData.append('bankName', formData.bankName);
      submitData.append('accountHolderName', formData.accountHolderName);
      submitData.append('accountNumber', formData.accountNumber);
      submitData.append('ifscCode', formData.ifscCode);
      submitData.append('branchName', formData.branchName);
      submitData.append('upiId', formData.upiId);

      if (profileImageFile) {
        submitData.append('profileImage', profileImageFile);
      }

      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      await axios.put(`${getBackendUrl()}/api/artist/profile`, submitData, config);
      
      await fetchProfile(); // Refresh global auth context if needed
      await loadArtistData(); // Reload local data
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error("Update failed", error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!artistData) {
    return <div className="p-8 text-center text-slate-500">Loading profile...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Profile Settings</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            {isEditing ? 'Edit your artist credentials and details' : 'View your artist credentials and details'}
          </p>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto card p-8 space-y-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-dark-border/40">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Edit Profile</h2>
            <button type="button" onClick={handleCancelEdit} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="h-32 w-32 rounded-full border-4 border-rose-100 dark:border-rose-900 overflow-hidden bg-slate-50 dark:bg-slate-900 flex items-center justify-center relative group cursor-pointer">
              {imagePreview ? (
                 <img src={imagePreview} alt={artistData.name} className="h-full w-full object-cover group-hover:opacity-50 transition-opacity" />
              ) : (
                 <User size={48} className="text-slate-400 group-hover:opacity-50 transition-opacity" />
              )}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <Upload size={24} className="text-white drop-shadow-md" />
              </div>
              <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
            <p className="text-xs font-semibold text-slate-500">Tap to change profile picture</p>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-rose-500 border-l-4 border-rose-500 pl-3">General Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Full Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Phone Number</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="input-field" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Genre</label>
                <input type="text" value={formData.genre} onChange={(e) => setFormData({...formData, genre: e.target.value})} className="input-field" placeholder="e.g. Pop, Hip Hop, Classical" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Artist Bio</label>
                <textarea rows={3} value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="input-field" placeholder="Tell your fans about yourself..." />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Label</label>
                <input type="text" value={formData.label} onChange={(e) => setFormData({...formData, label: e.target.value})} className="input-field" placeholder="e.g. Universal Music, Independent" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Social Links</label>
                <p className="text-xs text-slate-400 mb-2">Format: `platform: https://link` (e.g., `instagram: https://instagram.com/artist`)</p>
                <textarea rows={3} value={formData.socialLinksText} onChange={(e) => setFormData({...formData, socialLinksText: e.target.value})} className="input-field" placeholder="instagram: https://...&#10;twitter: https://..." />
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500 border-l-4 border-emerald-500 pl-3">Bank Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Account Holder Name *</label>
                <input type="text" required value={formData.accountHolderName} onChange={(e) => setFormData({...formData, accountHolderName: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Bank Name *</label>
                <input type="text" required value={formData.bankName} onChange={(e) => setFormData({...formData, bankName: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Account Number *</label>
                <input type="text" required value={formData.accountNumber} onChange={(e) => setFormData({...formData, accountNumber: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">IFSC Code *</label>
                <input type="text" required value={formData.ifscCode} onChange={(e) => setFormData({...formData, ifscCode: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Branch Name</label>
                <input type="text" value={formData.branchName} onChange={(e) => setFormData({...formData, branchName: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">UPI ID</label>
                <input type="text" value={formData.upiId} onChange={(e) => setFormData({...formData, upiId: e.target.value})} className="input-field" placeholder="username@upi" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100 dark:border-dark-border/40">
            <button type="button" onClick={handleCancelEdit} disabled={loading} className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 px-8 py-2.5">
              <Save size={18} />
              <span>{loading ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="max-w-3xl mx-auto card p-8 flex flex-col items-center animate-in fade-in zoom-in-95 duration-200 relative">
          <div className="h-32 w-32 rounded-full border-4 border-rose-100 dark:border-rose-900 overflow-hidden bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-6">
            {imagePreview ? (
               <img src={imagePreview} alt={artistData.name} className="h-full w-full object-cover" />
            ) : (
               <User size={48} className="text-slate-400" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-1">
            {artistData.name || 'Artist Name'}
            {artistData.isVerified && (
              <span title="Verified" className="flex items-center">
                <CheckCircle className="text-blue-500" size={20} />
              </span>
            )}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
            {artistData.email} {artistData.phone && `• ${artistData.phone}`}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {artistData.role && (
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-semibold capitalize">
                Role: {artistData.role}
              </span>
            )}
            {artistData.genre && (
              <span className="px-3 py-1 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full text-xs font-semibold">
                Genre: {artistData.genre}
              </span>
            )}
            {artistData.profileStatus && (
              <span className={`px-3 py-1 rounded-md text-xs font-semibold capitalize ${artistData.profileStatus === 'complete' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                Status: {artistData.profileStatus}
              </span>
            )}
          </div>

          {artistData.bio && (
            <div className="w-full text-center mb-8">
              <p className="text-slate-700 dark:text-slate-300 italic">"{artistData.bio}"</p>
            </div>
          )}

          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100 dark:border-dark-border/40 text-left">
            {/* General Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">General Info</h3>
              {(artistData.label || artistData.label === null) && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Label</p>
                  <p className="font-medium text-slate-800 dark:text-white">{artistData.label || 'N/A'}</p>
                </div>
              )}
              {artistData.socialLinks && Object.keys(artistData.socialLinks).length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Social Links</p>
                  <div className="flex flex-col gap-1">
                    {Object.entries(artistData.socialLinks).map(([platform, link]) => (
                      <a key={platform} href={link as string} target="_blank" rel="noreferrer" className="text-rose-500 hover:underline text-sm capitalize">
                        {platform}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bank Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Bank Details</h3>
              {artistData.bankName && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Bank Name</p>
                  <p className="font-medium text-slate-800 dark:text-white">{artistData.bankName} {artistData.branchName && `(${artistData.branchName})`}</p>
                </div>
              )}
              {artistData.accountHolderName && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Account Holder</p>
                  <p className="font-medium text-slate-800 dark:text-white">{artistData.accountHolderName}</p>
                </div>
              )}
              {artistData.accountNumber && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Account Number</p>
                  <p className="font-medium text-slate-800 dark:text-white">••••{artistData.accountNumber.slice(-4)}</p>
                </div>
              )}
              {artistData.ifscCode && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">IFSC Code</p>
                  <p className="font-medium text-slate-800 dark:text-white">{artistData.ifscCode}</p>
                </div>
              )}
              {artistData.upiId && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">UPI ID</p>
                  <p className="font-medium text-slate-800 dark:text-white">{artistData.upiId}</p>
                </div>
              )}
            </div>
          </div>

          <div className="w-full mt-8 pt-6 border-t border-slate-100 dark:border-dark-border/40 flex justify-end">
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
            >
              <Edit2 size={16} />
              <span>Edit Profile Details</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
