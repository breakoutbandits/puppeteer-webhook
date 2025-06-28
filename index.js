const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

// ✅ Beveiliging met API-key via header
const API_KEY = 'Bandits2022!';
app.use('/run', (req, res, next) => {
  const incomingKey = req.headers['x-api-key'];
  if (incomingKey !== API_KEY) {
    return res.status(403).json({ success: false, message: 'Forbidden: Invalid API key' });
  }
  next();
});

app.post('/run', async (req, res) => {
  console.log('🚀 /run endpoint aangeroepen');
  const data = req.body;

  const formData = {
    username: data.username || 'support@breakoutbandits.com',
    password: data.password || 'Bandits2022!',
  };

  const browser = await puppeteer.launch({
    headless: "new", // voorkom warning
    executablePath: puppeteer.executablePath(), // forceer juiste Chrome-pad
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // 1. Ga naar de Loquiz loginpagina
    console.log('🌍 Navigeren naar inlogpagina...');
    await page.goto('https://creator.loquiz.com/login', { waitUntil: 'networkidle2' });

    // 2. Zoek de juiste inputvelden
    const inputSelectors = await page.$$eval('input', inputs =>
      inputs.map(input => ({
        type: input.type,
        placeholder: input.placeholder
      }))
    );

    const emailIndex = inputSelectors.findIndex(i => i.placeholder.toLowerCase().includes('email'));
    const passIndex = inputSelectors.findIndex(i => i.placeholder.toLowerCase().includes('password'));

    const inputs = await page.$$('input');
    await inputs[emailIndex].type(formData.username);
    await inputs[passIndex].type(formData.password);

    // 3. Klik op de knop "Log in"
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    // 4. Controleer of je bent ingelogd
    const pageUrl = page.url();
    console.log('🌐 Huidige URL na login:', pageUrl);
    if (pageUrl.includes('/dashboard') || !pageUrl.includes('/login')) {
      res.json({ success: true, message: 'Succesvol ingelogd op Loquiz!' });
    } else {
      res.status(401).json({ success: false, message: 'Login mislukt. Check gebruikersnaam en wachtwoord.' });
    }

  } catch (err) {
    console.error('❌ Fout tijdens loginproces:', err);
    res.status(500).json({ success: false, error: err.toString() });
  } finally {
    await browser.close();
    console.log('🧹 Browser gesloten');
  }
});

app.get('/', (req, res) => {
  res.send('✅ Puppeteer-service draait');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server draait op poort ${PORT}`));
