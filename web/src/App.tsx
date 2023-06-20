import { useEffect, useState } from 'react'
import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import LinearProgressWithLabel from './progressbar'
import parse from 'html-react-parser'

function App() {
  const [search, setSearch] = useState<string>('');
  const [urls, setUrls] = useState<string[]>([]);

  const [nowDownloading, setNowDownloading] = useState<string>('');
  const [transferredValue, setTransferredValue] = useState<number>();
  const [totalValue, setTotalValue] = useState<number>();
  const [downloadSpeed, setDownloadSpeed] = useState<number>();
  const [workers, setWorkers] = useState<number>();
  const [percentValue, setPercentValue] = useState<number>();

  const getUrls = async (keyWord: string) => {
    fetch(`http://${import.meta.env.VITE_API_URL}/urls/${keyWord}`).then(async response => {
      const res = await response.json();
      setUrls(res);
    })
  }

  function startDownload(downloadUrl: string) {
    const socket = new WebSocket(`ws://${import.meta.env.VITE_API_URL}/ws`);
    setNowDownloading(downloadUrl);
    socket.onopen = () => {
      socket.send(downloadUrl);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.fileSize) {
        const fileSize = parseInt(data.fileSize);
        console.log('File size:', fileSize);
      }

      if (data.transferred) {
        const transferred = parseInt(data.transferred);
        const total = parseInt(data.total);
        const percent = parseInt(data.percent);
        const workers = parseInt(data.workers);
        const downloadSpeed = parseFloat(data.speed)
        setTransferredValue(transferred);
        setTotalValue(total);
        setPercentValue(percent);
        setWorkers(workers);
        setDownloadSpeed(downloadSpeed)
        if (transferred === total) {
          localStorage.setItem(downloadUrl, data.fileData);
          console.log('Download complete. File saved in localStorage.');
          setNowDownloading('');
          setTransferredValue(undefined);
          setTotalValue(undefined);
          setPercentValue(undefined);
          setPercentValue(workers - 1);
          setDownloadSpeed(undefined)
        }
      }
    };
  };

  const getLocalFile = (url: string) => {
    let item = localStorage.getItem(url)
    return item ? item : '';
  }

  useEffect(() => {
  }, [transferredValue, totalValue, percentValue, nowDownloading])

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      padding: 4,
      paddingTop: 10,
    }}>
      <Stack direction='column' gap={3}>
        <Stack direction='row' gap={2}>
          <TextField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Button variant="contained" onClick={() => getUrls(search)}>
            search
          </Button>
        </Stack>
        <Stack direction='column' gap={2}>
          {urls?.map((url) =>
            <Box key={url}>
              <Button variant="text" onClick={() => startDownload(url)}>
                {url}
              </Button>
              {nowDownloading === url &&
                <Stack gap={2} direction='column'>
                  <LinearProgressWithLabel progress={percentValue} />
                  <Typography>{workers} workers</Typography>
                  <Typography>{downloadSpeed} kB/s</Typography>
                </Stack>
              }
              <Box sx={{
                display: 'block',
              }}>
                {parse(getLocalFile(url))}
              </Box>
            </Box>

          )}
        </Stack>
      </Stack>
    </Box >
  )
}

export default App
