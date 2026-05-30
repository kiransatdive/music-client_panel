import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { getBackendUrl } from '../utils/config';
import { User, DollarSign } from 'lucide-react';

const parseSocialLinksToObj = (text: string): Record<string, string> => {
  const lines = text.split('\n');
  const obj: Record<string, string> = {};
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex !== -1) {
      const key = trimmed.substring(0, colonIndex).trim();
      const val = trimmed.substring(colonIndex + 1).trim();
      if (key && val) {
        obj[key] = val;
        return;
      }
    }
    
    // Fallback: Guess platform name from the string/URL
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
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'bank'>('profile');

  // Forms states
  const [profileData, setProfileData] = useState({
    artist_name: '',
    email: '',
    phone: '',
    bio: '',
    website: '',
    social_links: '',
    genre: '',
  });

  const [bankData, setBankData] = useState({
    bank_name: '',
    account_number: '',
    account_holder: '',
    routing_number: '',
    branch_name: '',
    upi_id: '',
  });

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    loadArtistData();
  }, []);

  const loadArtistData = async () => {
    try {
      const response = await axios.get('/api/artist/profile');
      const artist = response.data?.data?.artist;
      if (artist) {
        setProfileData({
          artist_name: artist.name || '',
          email: artist.email || '',
          phone: artist.phone || '',
          bio: artist.bio || '',
          website: artist.website || '',
          social_links: formatSocialLinksToString(artist.socialLinks),
          genre: artist.genre || '',
        });

        setBankData({
          bank_name: artist.bankName || '',
          account_number: artist.accountNumber || '',
          account_holder: artist.accountHolderName || '',
          routing_number: artist.ifscCode || '',
          branch_name: artist.branchName || '',
          upi_id: artist.upiId || '',
        });

        if (artist.profileImage) {
          const backendUrl = getBackendUrl();
          setImagePreview(`${backendUrl}/${artist.profileImage}`);
        }
      }
    } catch (err) {
      console.error("Failed to load full profile data", err);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      data.append('name', profileData.artist_name);
      data.append('phone', profileData.phone);
      data.append('bio', profileData.bio);
      data.append('genre', profileData.genre);
      
      const socialLinksObj = parseSocialLinksToObj(profileData.social_links);
      data.append('socialLinks', JSON.stringify(socialLinksObj));
      data.append('social_links', JSON.stringify(socialLinksObj));
      
      if (profileImage) data.append('profileImage', profileImage);

      const response = await axios.put('/api/artist/profile', data);
      
      // Update local state with the returned data from PUT request
      const updatedArtist = response.data?.data?.artist;
      if (updatedArtist) {
        setProfileData({
          artist_name: updatedArtist.name || '',
          email: updatedArtist.email || '',
          phone: updatedArtist.phone || '',
          bio: updatedArtist.bio || '',
          website: updatedArtist.website || '',
          social_links: formatSocialLinksToString(updatedArtist.socialLinks),
          genre: updatedArtist.genre || '',
        });
      }

      await fetchProfile();
      alert('Profile updated successfully');
    } catch (error) {
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.put('/api/artist/profile', {
        // camelCase fields
        bankName: bankData.bank_name,
        accountNumber: bankData.account_number,
        accountHolderName: bankData.account_holder,
        ifscCode: bankData.routing_number,
        branchName: bankData.branch_name,
        upiId: bankData.upi_id,
        // snake_case fields
        bank_name: bankData.bank_name,
        account_number: bankData.account_number,
        account_holder_name: bankData.account_holder,
        ifsc_code: bankData.routing_number,
        branch_name: bankData.branch_name,
        upi_id: bankData.upi_id,
      });

      // Update local state with the returned data from PUT request
      const updatedArtist = response.data?.data?.artist;
      if (updatedArtist) {
        setBankData({
          bank_name: updatedArtist.bankName || '',
          account_number: updatedArtist.accountNumber || '',
          account_holder: updatedArtist.accountHolderName || '',
          routing_number: updatedArtist.ifscCode || '',
          branch_name: updatedArtist.branchName || '',
          upi_id: updatedArtist.upiId || '',
        });
      }

      alert('Bank details updated successfully');
    } catch (error) {
      alert('Failed to update bank details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Profile Settings</h1>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Manage your artist credentials and financial details</p>
      </div>

      {/* Tabs list */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none border-b border-slate-200 dark:border-dark-border/30">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'profile'
              ? 'border-b-2 border-rose-500 text-rose-500 dark:text-rose-400 bg-rose-50/20 dark:bg-rose-950/10'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
        >
          <User size={16} />
          <span>Artist Profile</span>
        </button>
        <button
          onClick={() => setActiveTab('bank')}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'bank'
              ? 'border-b-2 border-rose-500 text-rose-500 dark:text-rose-400 bg-rose-50/20 dark:bg-rose-950/10'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
        >
          <DollarSign size={16} />
          <span>Bank Details</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="mt-4">
        {activeTab === 'profile' && (
          <div className="card">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Artist Information</h2>
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Avatar Selector */}
              <div className="flex items-center gap-5">
                <div className="h-20 w-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-dark-border/40 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Artist Preview" className="h-full w-full object-cover" />
                  ) : (
                    <User size={32} className="text-slate-400" />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Profile Image</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleImageChange}
                    className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700 dark:file:bg-rose-950/30 dark:file:text-rose-400 hover:file:bg-rose-100 dark:hover:file:bg-rose-950/50 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Artist Name *</label>
                  <input
                    type="text"
                    required
                    value={profileData.artist_name}
                    onChange={(e) => setProfileData({ ...profileData, artist_name: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={profileData.email}
                    disabled
                    className="input-field bg-slate-50 dark:bg-dark-bg/60 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Website URL</label>
                  <input
                    type="url"
                    value={profileData.website}
                    onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                    className="input-field"
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Genre</label>
                  <input
                    type="text"
                    value={profileData.genre}
                    onChange={(e) => setProfileData({ ...profileData, genre: e.target.value })}
                    className="input-field"
                    placeholder="e.g. Pop, Rock, Rap"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Artist Biography</label>
                <textarea
                  rows={4}
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  className="input-field"
                  placeholder="Introduce yourself to the world..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Social Handles</label>
                <textarea
                  rows={3}
                  value={profileData.social_links}
                  onChange={(e) => setProfileData({ ...profileData, social_links: e.target.value })}
                  className="input-field"
                  placeholder="Instagram: @handle, Twitter: @handle (one per line)"
                />
              </div>

              <button type="submit" className="btn-primary py-3 px-6 text-sm font-semibold tracking-wide uppercase" disabled={loading}>
                {loading ? 'Saving Changes...' : 'Save Profile'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'bank' && (
          <div className="card">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Payment Information</h2>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Configure bank accounts to receive royalties and streaming payouts</p>
            </div>

            <form onSubmit={handleBankSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Bank Name *</label>
                  <input
                    type="text"
                    required
                    value={bankData.bank_name}
                    onChange={(e) => setBankData({ ...bankData, bank_name: e.target.value })}
                    className="input-field"
                    placeholder="e.g. State Bank of India"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Account Holder Name *</label>
                  <input
                    type="text"
                    required
                    value={bankData.account_holder}
                    onChange={(e) => setBankData({ ...bankData, account_holder: e.target.value })}
                    className="input-field"
                    placeholder="Owner's full name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Account Number *</label>
                  <input
                    type="text"
                    required
                    value={bankData.account_number}
                    onChange={(e) => setBankData({ ...bankData, account_number: e.target.value })}
                    className="input-field"
                    placeholder="Enter Account Number"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Routing Number / IFSC Code *</label>
                  <input
                    type="text"
                    required
                    value={bankData.routing_number}
                    onChange={(e) => setBankData({ ...bankData, routing_number: e.target.value })}
                    className="input-field"
                    placeholder="IFSC or Bank Routing Code"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Branch Name</label>
                  <input
                    type="text"
                    value={bankData.branch_name}
                    onChange={(e) => setBankData({ ...bankData, branch_name: e.target.value })}
                    className="input-field"
                    placeholder="e.g. Mumbai Main Branch"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">UPI ID</label>
                  <input
                    type="text"
                    value={bankData.upi_id}
                    onChange={(e) => setBankData({ ...bankData, upi_id: e.target.value })}
                    className="input-field"
                    placeholder="e.g. name@upi"
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary py-3 px-6 text-sm font-semibold tracking-wide uppercase" disabled={loading}>
                {loading ? 'Saving...' : 'Save Bank Details'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

