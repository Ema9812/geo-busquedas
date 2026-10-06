require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB, getDB, saveDB } = require('./db');
const { index } = require('./algolia');

const app = express();
app.use(cors());
app.use(express.json());

// ---------- POST /comercios ----------
app.post('/comercios', async (req, res) => {
  try {
    const { nombre, categoria, direccion, lat, lng } = req.body;
    const data = getDB();

    const nuevo = {
      id: ++data.lastId,
      nombre,
      categoria,
      direccion,
      lat,
      lng
    };
    data.comercios.push(nuevo);
    await saveDB();

    await index.saveObject({
      objectID: String(nuevo.id),
      nombre: nuevo.nombre,
      categoria: nuevo.categoria,
      direccion: nuevo.direccion,
      _geoloc: { lat: nuevo.lat, lng: nuevo.lng }
    });

    res.status(201).json(nuevo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---------- GET /comercios ----------
app.get('/comercios', (req, res) => {
  res.json(getDB().comercios);
});

// ---------- GET /comercios/:id ----------
app.get('/comercios/:id', (req, res) => {
  const c = getDB().comercios.find(x => x.id === Number(req.params.id));
  if (!c) return res.status(404).json({ error: 'No encontrado' });
  res.json(c);
});

// ---------- PUT /comercios/:id ----------
app.put('/comercios/:id', async (req, res) => {
  try {
    const { nombre, categoria, direccion, lat, lng } = req.body;
    const data = getDB();
    const c = data.comercios.find(x => x.id === Number(req.params.id));
    if (!c) return res.status(404).json({ error: 'No encontrado' });

    c.nombre = nombre;
    c.categoria = categoria;
    c.direccion = direccion;
    c.lat = lat;
    c.lng = lng;
    await saveDB();

    await index.saveObject({
      objectID: String(c.id),
      nombre: c.nombre,
      categoria: c.categoria,
      direccion: c.direccion,
      _geoloc: { lat: c.lat, lng: c.lng }
    });

    res.json(c);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- GET /comercios-cerca-de?lat&lng ----------
app.get('/comercios-cerca-de', async (req, res) => {
  try {
    const { lat, lng, radio = 1000 } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'Faltan lat y lng' });

    const { hits } = await index.search('', {
      aroundLatLng: `${lat}, ${lng}`,
      aroundRadius: Number(radio)
    });

    const ids = hits.map(h => Number(h.objectID));
    if (ids.length === 0) return res.json([]);

    const rows = getDB().comercios.filter(c => ids.includes(c.id));
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---------- Arranque ----------
const PORT = process.env.PORT || 3000;
initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 API en http://localhost:${PORT}`));
});