# YouTubeDownloader
JavaScript console application to download videos from YouTube

# Install
```
git clone https://github.com/Haxrox/YouTubeDownloader.git
npm install
```

# Usage
```
Usage: node main.js <youtube-url> [<output-path>] [<output-name>]
    <youtube-url> - The url of the YouTube video to download"
    <output-path> - The path to save the file to (default: Downloads)
    <output-name> - The name of the file (default: title of the video)
```

# Examples
```
node main.js https://www.youtube.com/watch?v=pXRviuL6vMY Videos \"TwentyOnePilots - Stressed Out\"
node main.js https://www.youtube.com/watch?v=pXRviuL6vMY C:\\Users\\UserName\\Videos \"TwentyOnePilots - Stressed Out\"
```
Both commands download the song [TwentyOnePilots - Stressed Out](https://www.youtube.com/watch?v=pXRviuL6vMY) to the user's `Video` folder


# Resources
- [ytdl-core](https://github.com/fent/node-ytdl-core)
- [FFmpeg](https://ffmpeg.org/)

# TODO
- [ ] Create a GUI version of this application (either web application or desktop application using [Electron](https://www.electronjs.org/))
- [ ] Implement playlist downloading / multi-video downloads
