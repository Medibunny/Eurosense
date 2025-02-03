const express = require('express');
const fetch = require('node-fetch'); 
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

async function generateBearerToken() {
  const response = await fetch(
    'https://api.singularity.icatalyst.com/v2/api/personalaccesstokens/8efedbf1-ba4e-48e1-afda-de4c86f02da2/accesstoken',
    {
      method: 'GET',
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to generate token: ${response.status} ${response.statusText}`);
  }
  const token = await response.text();

  return token;
}

app.use(cors());

app.get('/dashboards', async (req, res) => {
  try {
    const bearerToken = await generateBearerToken();
    
    const response = await fetch('https://openapi.sensemaker-suite.com/apis/dashboards/', {
      headers: {
        'Authorization': `Bearer ${bearerToken}`
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Sensemaker API Error: ${response.status} ${response.statusText}`
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/dashboards`);
});
