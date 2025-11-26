// Free music metadata service using iTunes Search API (no API key needed)

const ITUNES_SEARCH_URL = 'https://itunes.apple.com/search';

export async function searchSong(title, artist) {
  try {
    const query = encodeURIComponent(`${title} ${artist}`);
    const response = await fetch(`${ITUNES_SEARCH_URL}?term=${query}&entity=song&limit=1`);

    if (!response.ok) {
      console.error('iTunes API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const song = data.results[0];
      return {
        title: song.trackName,
        artist: song.artistName,
        album: song.collectionName,
        albumCover: song.artworkUrl100?.replace('100x100', '300x300') || song.artworkUrl100, // Get higher resolution
        albumCoverSmall: song.artworkUrl60,
        albumCoverLarge: song.artworkUrl100?.replace('100x100', '600x600'),
        previewUrl: song.previewUrl,
        genre: song.primaryGenreName,
        releaseDate: song.releaseDate,
        trackViewUrl: song.trackViewUrl
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching song metadata:', error);
    return null;
  }
}

export async function enrichSongDatabase(songs) {
  const enrichedSongs = await Promise.all(
    songs.map(async (song) => {
      try {
        const metadata = await searchSong(song.title, song.artist);

        if (metadata) {
          return {
            ...song,
            albumCover: metadata.albumCover,
            albumCoverSmall: metadata.albumCoverSmall,
            albumCoverLarge: metadata.albumCoverLarge,
            album: metadata.album,
            previewUrl: metadata.previewUrl,
            trackViewUrl: metadata.trackViewUrl
          };
        }

        // Return song with placeholder if API fails
        return {
          ...song,
          albumCover: '/placeholder-album.png',
          albumCoverSmall: '/placeholder-album.png',
          albumCoverLarge: '/placeholder-album.png'
        };
      } catch (error) {
        console.error(`Error enriching ${song.title}:`, error);
        return {
          ...song,
          albumCover: '/placeholder-album.png',
          albumCoverSmall: '/placeholder-album.png',
          albumCoverLarge: '/placeholder-album.png'
        };
      }
    })
  );

  return enrichedSongs;
}

export async function getSongMetadata(title, artist) {
  return await searchSong(title, artist);
}
