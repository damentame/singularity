import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music, 
  ChevronDown, ExternalLink, X, Shuffle, Repeat, ListMusic
} from 'lucide-react';

interface MusicPlatform {
  id: string;
  name: string;
  icon: string;
  color: string;
  url: string;
}

interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: string;
  coverUrl: string;
}

const musicPlatforms: MusicPlatform[] = [
  { id: 'spotify', name: 'Spotify', icon: '🎵', color: '#1DB954', url: 'https://open.spotify.com' },
  { id: 'apple-music', name: 'Apple Music', icon: '🎵', color: '#FC3C44', url: 'https://music.apple.com' },
  { id: 'deezer', name: 'Deezer', icon: '🎵', color: '#FEAA2D', url: 'https://www.deezer.com' },
  { id: 'tidal', name: 'Tidal', icon: '🎵', color: '#000000', url: 'https://tidal.com' },
  { id: 'amazon-music', name: 'Amazon Music', icon: '🎵', color: '#FF9900', url: 'https://music.amazon.com' },
  { id: 'youtube-music', name: 'YouTube Music', icon: '🎵', color: '#FF0000', url: 'https://music.youtube.com' },
  { id: 'soundcloud', name: 'SoundCloud', icon: '🎵', color: '#FF5500', url: 'https://soundcloud.com' },
  { id: 'pandora', name: 'Pandora', icon: '🎵', color: '#3668FF', url: 'https://www.pandora.com' },
  { id: 'audiomack', name: 'Audiomack', icon: '🎵', color: '#FFA200', url: 'https://audiomack.com' },
  { id: 'qobuz', name: 'Qobuz', icon: '🎵', color: '#0170EB', url: 'https://www.qobuz.com' },
];

const defaultPlaylist: Track[] = [
  {
    id: '1',
    title: 'Take Your Time',
    artist: 'Aurenza',
    album: 'Timeless Moments',
    duration: '4:32',
    coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&q=80',
  },
  {
    id: '2',
    title: 'Golden Hour',
    artist: 'Aurenza',
    album: 'Timeless Moments',
    duration: '3:45',
    coverUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&q=80',
  },
  {
    id: '3',
    title: 'Eternal Dance',
    artist: 'Aurenza',
    album: 'Celebration',
    duration: '5:12',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80',
  },
  {
    id: '4',
    title: 'First Light',
    artist: 'Aurenza',
    album: 'Dawn Collection',
    duration: '4:08',
    coverUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&q=80',
  },
  {
    id: '5',
    title: 'Whispered Promises',
    artist: 'Aurenza',
    album: 'Timeless Moments',
    duration: '3:56',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80',
  },
];

interface MusicPlayerProps {
  minimized?: boolean;
  onToggleMinimize?: () => void;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ minimized = false, onToggleMinimize }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [showPlatformSelector, setShowPlatformSelector] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<MusicPlatform | null>(null);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'all' | 'one'>('none');
  const [progress, setProgress] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const currentTrack = defaultPlaylist[currentTrackIndex];

  // Simulate progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            handleNext();
            return 0;
          }
          return prev + 0.5;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrackIndex]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handlePrevious = () => {
    setProgress(0);
    setCurrentTrackIndex(prev => (prev === 0 ? defaultPlaylist.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setProgress(0);
    if (isShuffled) {
      const randomIndex = Math.floor(Math.random() * defaultPlaylist.length);
      setCurrentTrackIndex(randomIndex);
    } else {
      setCurrentTrackIndex(prev => (prev === defaultPlaylist.length - 1 ? 0 : prev + 1));
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value));
    if (Number(e.target.value) === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const selectPlatform = (platform: MusicPlatform) => {
    setSelectedPlatform(platform);
    setShowPlatformSelector(false);
  };

  const openPlatform = () => {
    if (selectedPlatform) {
      window.open(selectedPlatform.url, '_blank');
    }
  };

  const selectTrack = (index: number) => {
    setCurrentTrackIndex(index);
    setProgress(0);
    setIsPlaying(true);
    setShowPlaylist(false);
  };

  const cycleRepeatMode = () => {
    if (repeatMode === 'none') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('none');
  };

  if (minimized) {
    return (
      <div 
        className="fixed bottom-4 right-4 z-50 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full p-3 cursor-pointer hover:bg-white/20 transition-all shadow-2xl"
        onClick={onToggleMinimize}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
          </div>
          <div className="pr-2">
            <p className="text-white text-sm font-medium truncate max-w-[120px]">{currentTrack.title}</p>
            <p className="text-white/60 text-xs">{currentTrack.artist}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePlayPause();
            }}
            className="w-8 h-8 rounded-full bg-gold flex items-center justify-center"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-navy" />
            ) : (
              <Play className="w-4 h-4 text-navy ml-0.5" />
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
            <Music className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="text-white font-display text-lg">Event Music</h3>
            <p className="text-white/50 text-xs font-body">Set the mood for your celebration</p>
          </div>
        </div>
        <button
          onClick={() => setShowPlatformSelector(!showPlatformSelector)}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-body flex items-center gap-2 transition-colors"
        >
          {selectedPlatform ? (
            <>
              <span style={{ color: selectedPlatform.color }}>{selectedPlatform.name}</span>
              <ChevronDown className="w-4 h-4" />
            </>
          ) : (
            <>
              Connect Platform
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Platform Selector Dropdown */}
      {showPlatformSelector && (
        <div className="absolute right-4 top-20 z-50 bg-navy border border-white/20 rounded-xl shadow-2xl p-2 w-64 animate-fadeIn">
          <p className="text-white/50 text-xs font-body px-3 py-2">Select your music platform</p>
          <div className="max-h-64 overflow-y-auto">
            {musicPlatforms.map(platform => (
              <button
                key={platform.id}
                onClick={() => selectPlatform(platform)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: platform.color + '20' }}
                >
                  <Music className="w-4 h-4" style={{ color: platform.color }} />
                </div>
                <span className="text-white font-body text-sm">{platform.name}</span>
                {selectedPlatform?.id === platform.id && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-gold" />
                )}
              </button>
            ))}
          </div>
          {selectedPlatform && (
            <button
              onClick={openPlatform}
              className="w-full mt-2 px-3 py-2 bg-gold/20 hover:bg-gold/30 rounded-lg text-gold text-sm font-body flex items-center justify-center gap-2 transition-colors"
            >
              Open {selectedPlatform.name}
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Now Playing */}
      <div className="p-6">
        <div className="flex items-center gap-6">
          {/* Album Art */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-xl overflow-hidden shadow-xl">
              <img 
                src={currentTrack.coverUrl} 
                alt={currentTrack.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            {isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                <div className="flex gap-1">
                  <div className="w-1 h-4 bg-gold rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                  <div className="w-1 h-6 bg-gold rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <div className="w-1 h-3 bg-gold rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                  <div className="w-1 h-5 bg-gold rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Track Info */}
          <div className="flex-1">
            <h4 className="text-white font-display text-xl mb-1">{currentTrack.title}</h4>
            <p className="text-white/60 font-body text-sm mb-1">{currentTrack.artist}</p>
            {currentTrack.album && (
              <p className="text-white/40 font-body text-xs">{currentTrack.album}</p>
            )}
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-gold to-gold-light rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-white/40 text-xs font-body">
                  {Math.floor((progress / 100) * 272)}:{String(Math.floor(((progress / 100) * 272) % 60)).padStart(2, '0')}
                </span>
                <span className="text-white/40 text-xs font-body">{currentTrack.duration}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 mt-6">
          <button
            onClick={() => setIsShuffled(!isShuffled)}
            className={`p-2 rounded-lg transition-colors ${isShuffled ? 'text-gold' : 'text-white/50 hover:text-white'}`}
          >
            <Shuffle className="w-5 h-5" />
          </button>
          
          <button
            onClick={handlePrevious}
            className="p-2 text-white/70 hover:text-white transition-colors"
          >
            <SkipBack className="w-6 h-6" />
          </button>
          
          <button
            onClick={handlePlayPause}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-gold-light via-gold to-gold-dark flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-navy" />
            ) : (
              <Play className="w-6 h-6 text-navy ml-1" />
            )}
          </button>
          
          <button
            onClick={handleNext}
            className="p-2 text-white/70 hover:text-white transition-colors"
          >
            <SkipForward className="w-6 h-6" />
          </button>
          
          <button
            onClick={cycleRepeatMode}
            className={`p-2 rounded-lg transition-colors relative ${repeatMode !== 'none' ? 'text-gold' : 'text-white/50 hover:text-white'}`}
          >
            <Repeat className="w-5 h-5" />
            {repeatMode === 'one' && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold text-navy text-[10px] font-bold rounded-full flex items-center justify-center">1</span>
            )}
          </button>
        </div>

        {/* Volume & Playlist */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <button onClick={toggleMute} className="text-white/50 hover:text-white transition-colors">
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold"
            />
          </div>
          
          <button
            onClick={() => setShowPlaylist(!showPlaylist)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${showPlaylist ? 'bg-gold/20 text-gold' : 'text-white/50 hover:text-white'}`}
          >
            <ListMusic className="w-4 h-4" />
            <span className="text-sm font-body">Playlist</span>
          </button>
        </div>
      </div>

      {/* Playlist */}
      {showPlaylist && (
        <div className="border-t border-white/10 max-h-64 overflow-y-auto">
          {defaultPlaylist.map((track, index) => (
            <button
              key={track.id}
              onClick={() => selectTrack(index)}
              className={`w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors ${
                currentTrackIndex === index ? 'bg-gold/10' : ''
              }`}
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 text-left">
                <p className={`font-body text-sm ${currentTrackIndex === index ? 'text-gold' : 'text-white'}`}>
                  {track.title}
                </p>
                <p className="text-white/50 text-xs font-body">{track.artist}</p>
              </div>
              <span className="text-white/40 text-xs font-body">{track.duration}</span>
              {currentTrackIndex === index && isPlaying && (
                <div className="flex gap-0.5">
                  <div className="w-0.5 h-3 bg-gold rounded-full animate-pulse" />
                  <div className="w-0.5 h-4 bg-gold rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <div className="w-0.5 h-2 bg-gold rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Platform Connection Info */}
      <div className="p-4 bg-white/5 border-t border-white/10">
        <p className="text-white/40 text-xs font-body text-center">
          Connect your preferred music platform to create custom playlists for your event
        </p>
      </div>
    </div>
  );
};

export default MusicPlayer;
