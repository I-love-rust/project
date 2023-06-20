const webSocket = require('ws');
const cors = require('cors');
const express = require('express');
const http = require('http');
const https = require('https');
const url = require('url');
const async = require('async');

// init app
const app = express();
app.use(express.json());
app.use(cors());

// init config from env
const config = {
  "server": {
    "network": process.env.NETWORK,
    "port": process.env.PORT,
    "workers": process.env.WORKERS
  }
}

// creating and limiting the maximum number of download threads
const queue = async.queue((task, callback) => {
  task(callback);
}, config.server.workers);

// create hashmap for storing key - [urls...]
const keywordMap = new Map();

// route to add keyword
app.post('/keywords', (req, res) => {
  const { keyword, urls } = req.body;
  keywordMap.set(keyword, urls);
  res.status(200).send('Keyword and URLs added successfully');
});

// route to get links by keyword
app.get('/urls/:keyword', (req, res) => {
  const { keyword } = req.params;
  const urls = keywordMap.get(keyword) || [];
  res.status(200).json(urls);
});

// run server
const server = app.listen(config.server.port, () => {
  console.log(`Server is running on port ${config.server.port}`);
});

// run websocker server
const wss = new webSocket.Server({ server });

wss.on('connection', (ws) => {
  // accept download link
  ws.on('message', (message) => {
    queue.push((callback) => {
      startDownload(ws, message.toString(), callback);
    });
  });
});

function startDownload(connection, downloadUrl, callback) {
  // init link
  const options = new url.URL(downloadUrl);

  const protocol = options.protocol === 'https:' ? https : http;

  // for calc download speed
  const startTime = Date.now();

  const request = protocol.get(options, (response) => {
    const contentLength = response.headers['content-length'];
    let downloadedBytes = 0;
    const chunks = [];

    response.on('data', (chunk) => {
      downloadedBytes += chunk.length;
      chunks.push(chunk);

      const currentChunkTime = Date.now();
      const chunkDuration = currentChunkTime - startTime;

      const downloadSpeed = (downloadedBytes / 1000) / (chunkDuration / 1000)

      connection.send(
        JSON.stringify({
          transferred: downloadedBytes,
          total: contentLength,
          percent: (downloadedBytes / contentLength) * 100,
          speed: downloadSpeed,
          workers: queue.workersList().length
        })
      );

      if (downloadSpeed > config.server.network) {
        response.pause();
        setTimeout(() => {
          response.resume();
        }, 1000);
      }

      lastChunkTime = currentChunkTime;
    });

    response.on('end', () => {
      const fileData = Buffer.concat(chunks);
      const fileBase64 = fileData.toString();

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const speedInBytesPerSecond = downloadedBytes / (totalTime / 1000);
      const speedInKilobitsPerSecond = speedInBytesPerSecond / 1000;

      connection.send(
        JSON.stringify({
          transferred: contentLength,
          total: contentLength,
          percent: 100,
          fileData: fileBase64,
          url: options.hostname + options.pathname,
          speed: speedInKilobitsPerSecond,
          workers: queue.workersList().length
        })
      );
      callback();
    });
  });

  request.on('error', (error) => {
    callback('Download error:', error.message);
  });
}
