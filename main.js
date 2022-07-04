// Buildin with nodejs
const cp = require('child_process');
const readline = require('readline');
const fs = require('fs');
// External modules
const ytdl = require('ytdl-core');
const ffmpeg = require('ffmpeg-static');

const args = process.argv.slice(2);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const prompt = (query) => new Promise((resolve) => rl.question(query, resolve));

async function completed() {
    try {
        await prompt("Press any key to exit ...");
    } catch (exception) {
        console.error("ERROR: Failed to prompt user");
    } finally {
        rl.close();
    }
    process.exit();
}
/**
 * Downloads the video from the given url and saves it to the given path.
 * @param {string} url The url of the video to download
 */
async function download(url) {
    if (ytdl.validateURL(url) && url.toUpperCase() !== "--HELP" && url.toUpperCase() !== "-H") {
        ytdl.getInfo(url).then(info => {
            // Global constants
            const tracker = {
                start: Date.now(),
                audio: { downloaded: 0, total: Infinity },
                video: { downloaded: 0, total: Infinity },
                merged: { frame: 0, speed: '0x', fps: 0 },
            };

            const filePath = (args[1] ? (args[1].startsWith("C://") ? args[1] : `${process.env.USERPROFILE}\\${args[1]}`) : `${process.env.USERPROFILE}\\Downloads`);
            const fileName = (args[2] || info.videoDetails.title).concat(".mp4");
            console.log(`Downloading ${fileName} to ${filePath} ...`);
            // Get audio and video streams
            const audio = ytdl.downloadFromInfo(info, { quality: 'highestaudio' })
                .on('progress', (_, downloaded, total) => {
                    tracker.audio = { downloaded, total };
                });
            const video = ytdl.downloadFromInfo(info, { quality: 'highestvideo' })
                .on('progress', (_, downloaded, total) => {
                    tracker.video = { downloaded, total };
                });

            // Prepare the progress bar
            let progressbarHandle = null;
            const progressbarInterval = 1000;
            const showProgress = () => {
                readline.cursorTo(process.stdout, 0);
                const toMB = i => (i / 1024 / 1024).toFixed(2);

                process.stdout.write(`Audio  | ${(tracker.audio.downloaded / tracker.audio.total * 100).toFixed(2)}% processed `);
                process.stdout.write(`(${toMB(tracker.audio.downloaded)}MB of ${toMB(tracker.audio.total)}MB).${' '.repeat(10)}\n`);

                process.stdout.write(`Video  | ${(tracker.video.downloaded / tracker.video.total * 100).toFixed(2)}% processed `);
                process.stdout.write(`(${toMB(tracker.video.downloaded)}MB of ${toMB(tracker.video.total)}MB).${' '.repeat(10)}\n`);

                process.stdout.write(`Merged | processing frame ${tracker.merged.frame} `);
                process.stdout.write(`(at ${tracker.merged.fps} fps => ${tracker.merged.speed}).${' '.repeat(10)}\n`);

                process.stdout.write(`running for: ${((Date.now() - tracker.start) / 1000 / 60).toFixed(2)} Minutes.`);
                readline.moveCursor(process.stdout, 0, -3);
            };

            // Start the ffmpeg child process
            // console.log(ffmpeg);
            // console.log(__dirname);
            // fs.readdirSync(__dirname.concat("\\node_modules\\ffmpeg-static")).forEach(file => console.log(file));

            const ffmpegProcess = cp.spawn(ffmpeg, [
                // Remove ffmpeg's console spamming
                '-loglevel', '8', '-hide_banner',
                // Redirect/Enable progress messages
                '-progress', 'pipe:3',
                // Set inputs
                '-i', 'pipe:4',
                '-i', 'pipe:5',
                // Map audio & video from streams
                '-map', '0:a',
                '-map', '1:v',
                // Keep encoding
                '-c:v', 'copy',
                // Define output file
                filePath.concat("\\").concat(fileName),
            ], {
                windowsHide: true,
                stdio: [
                    /* Standard: stdin, stdout, stderr */
                    'inherit', 'inherit', 'inherit',
                    /* Custom: pipe:3, pipe:4, pipe:5 */
                    'pipe', 'pipe', 'pipe',
                ],
            });

            ffmpegProcess.on('error', error =>
                console.error(`ERROR: ${error}`)
            );

            ffmpegProcess.on('close', (code, signal) => {
                // Cleanup
                process.stdout.write('\n\n\n\n');

                if (code === 0) {
                    console.log(`Successfully downloaded ${fileName} [${url}] at ${filePath}`);
                }

                clearInterval(progressbarHandle);
                completed();
            });

            // Link streams
            // FFmpeg creates the transformer streams and we just have to insert / read data
            ffmpegProcess.stdio[3].on('data', chunk => {
                // Start the progress bar
                if (!progressbarHandle) progressbarHandle = setInterval(showProgress, progressbarInterval);
                // Parse the param=value list returned by ffmpeg
                const lines = chunk.toString().trim().split('\n');
                const args = {};
                for (const l of lines) {
                    const [key, value] = l.split('=');
                    args[key.trim()] = value.trim();
                }
                tracker.merged = args;
            });

            audio.pipe(ffmpegProcess.stdio[4]);
            video.pipe(ffmpegProcess.stdio[5]);
        }).catch(error =>
            console.error(`ERROR: ${error}`)
        );
    } else if (url.toUpperCase() === "--HELP" || url.toUpperCase() === "-H" || args.length <= 0) {
        console.log("Usage: node main.js <youtube-url> [<output-path>] [<output-name>]");
        console.log("\t<youtube-url> - The url of the youtube video to download");
        console.log("\t<output-path> - The path to save the file to (default: Downloads)");
        console.log("\t<output-name> - The name of the file (default: title of the video)");
        console.log("Example: node main.js https://www.youtube.com/watch?v=pXRviuL6vMY Videos \"TwentyOnePilots - Stressed Out\"");
        console.log("Example: node main.js https://www.youtube.com/watch?v=pXRviuL6vMY C:\\Users\\UserName\\Videos \"TwentyOnePilots - Stressed Out\"");
        completed();
    } else {
        console.error(`ERROR: args[0] (${args[0]}) is not a valid YouTube URL`);
        completed();
    }
}

/**
 * Prompts the user for input and downloads the video (if possible)
 */
async function promptUser() {
    try {
        args[0] = await prompt("Enter the URL: ");
        // args[1] = await prompt("Enter the path to save the video: ");
        // args[2] = await prompt("Enter the filename for the video: ");
    } catch (e) {
        console.error("ERROR: cannot prompt user");
    }
}
/**
 * Main function
 */
async function main() {
    if (args.length <= 0) {
        await promptUser();
    } 
    download(args[0]);
}

main();