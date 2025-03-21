const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/info', async (req, res) => {
  try {
    const videoURL = req.query.url;
    if (!videoURL) {
      return res.status(400).json({ error: 'URL video diperlukan' });
    }

    const info = await ytdl.getInfo(videoURL);
    
    const formats = info.formats.map(format => ({
      itag: format.itag,
      quality: format.qualityLabel || format.quality,
      mimeType: format.mimeType,
      container: format.container,
      hasAudio: format.hasAudio,
      hasVideo: format.hasVideo,
      contentLength: format.contentLength
    }));

    res.json({
      videoId: info.videoDetails.videoId,
      title: info.videoDetails.title,
      author: info.videoDetails.author.name,
      lengthSeconds: info.videoDetails.lengthSeconds,
      thumbnailUrl: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
      formats: formats
    });
  } catch (error) {
    console.error('Error fetching video info:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/download', async (req, res) => {
  try {
    const { url, itag, title } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL video diperlukan' });
    }

    const info = await ytdl.getInfo(url);

    const format = itag ? { itag: parseInt(itag) } : 'highest';
    
    const cleanTitle = (title || info.videoDetails.title).replace(/[^\w\s]/gi, '');
    const contentType = itag ? 
      info.formats.find(f => f.itag === parseInt(itag))?.mimeType || 'video/mp4' :
      'video/mp4';
    
    res.header('Content-Disposition', `attachment; filename="${cleanTitle}.mp4"`);
    res.header('Content-Type', contentType);
    
    ytdl(url, { quality: format })
      .pipe(res);
      
  } catch (error) {
    console.error('Error downloading video:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});