const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const fs = require('fs');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

async function generateBearerToken() {
  const response = await fetch('https://api.singularity.icatalyst.com/v2/api/personalaccesstokens/8efedbf1-ba4e-48e1-afda-de4c86f02da2/accesstoken', { method: 'GET' });
  if (!response.ok) {
    throw new Error(`Failed to generate token: ${response.status} ${response.statusText}`);
  }
  const token = await response.text();
  return token;
}

async function fetchAndSaveCsv() {
  try {
    const bearerToken = await generateBearerToken();
    const response = await fetch('https://api-gateway.sensemaker-suite.com/v2/frameworks/d1c06283-3a51-4050-ac6d-ea29ae75f32c/captures/', {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        Accept: 'text/csv; version=1',
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const csvData = await response.text();
    fs.writeFileSync('./captures.csv', csvData);
    console.log(`[${new Date().toISOString()}] CSV saved to captures.csv`);
  } catch (error) {
    console.error('Error fetching/saving CSV:', error);
  }
}

cron.schedule('0 0 * * *', async () => {
  console.log('Running daily CSV fetch job...');
  await fetchAndSaveCsv();
});

app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello! This server automatically downloads CSV daily. Try /dashboards for dashboard data.');
});

app.get('/dashboards', async (req, res) => {
  try {
    const bearerToken = await generateBearerToken();
    const response = await fetch('https://openapi.sensemaker-suite.com/apis/dashboards/', {
      headers: { Authorization: `Bearer ${bearerToken}` },
    });
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: `Sensemaker API Error: ${response.status} ${response.statusText} - ${errorText}`,
      });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error in /dashboards route:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/save-csv', async (req, res) => {
  try {
    await fetchAndSaveCsv();
    res.json({ message: 'CSV fetched and saved successfully' });
  } catch (error) {
    console.error('Error in /save-csv route:', error);
    res.status(500).json({ error: 'Failed to save CSV' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
