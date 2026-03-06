import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || '127.0.0.1';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';

const app = express();
const upload = multer();

app.use(cors({ origin: FRONTEND_ORIGIN === '*' ? true : FRONTEND_ORIGIN, credentials: true }));
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true }));

const defaultDb = {
  users: [
    {
      id: 'u1',
      name: 'Designer Demo',
      email: 'designer@example.com',
      password: 'Password@123',
    },
  ],
  slides: [
    {
      id: '1',
      slideName: 'Welcome Slide',
      type: 'presentation',
      status: 'published',
      rank: 1,
      thumbnail: 'https://picsum.photos/seed/slide1/640/360',
      background: 'https://picsum.photos/seed/bg1/1200/700',
      html: '',
      elements: [
        {
          id: 'el-1',
          type: 'text',
          content: 'Welcome to the presentation',
          x: 80,
          y: 90,
          width: 540,
          height: 90,
          zIndex: 1,
          color: '#ffffff',
          fontSize: 42,
          fontWeight: 700,
        },
      ],
      media: [
        {
          id: 'm-1',
          type: 'image',
          name: 'Cover image',
          url: 'https://picsum.photos/seed/media1/800/450',
          thumbnail: 'https://picsum.photos/seed/media1/320/180',
        },
      ],
      screenshot: null,
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      slideName: 'Product Highlights',
      type: 'presentation',
      status: 'draft',
      rank: 2,
      thumbnail: 'https://picsum.photos/seed/slide2/640/360',
      background: 'https://picsum.photos/seed/bg2/1200/700',
      html: '',
      elements: [],
      media: [
        {
          id: 'm-2',
          type: 'image',
          name: 'Product shot',
          url: 'https://picsum.photos/seed/media2/800/450',
          thumbnail: 'https://picsum.photos/seed/media2/320/180',
        },
      ],
      screenshot: null,
      updatedAt: new Date().toISOString(),
    },
  ],
};

const sessions = new Map();

const ensureDb = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2));
  }
};

const readDb = () => {
  ensureDb();
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
};

const writeDb = (nextDb) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(nextDb, null, 2));
};

const safeSlide = (slide) => ({
  id: slide.id,
  slideName: slide.slideName,
  name: slide.slideName,
  type: slide.type,
  status: slide.status,
  rank: slide.rank,
  thumbnail: slide.thumbnail,
  background: slide.background,
  html: slide.html,
  updatedAt: slide.updatedAt,
});

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ message: 'Unauthenticated' });
  }
  req.user = sessions.get(token);
  req.token = token;
  return next();
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'slide-editor-backend' });
});

app.post('/api/login', upload.none(), (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  const db = readDb();
  const user = db.users.find((row) => row.email.toLowerCase() === email && row.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = crypto.randomBytes(24).toString('hex');
  const authUser = { id: user.id, name: user.name, email: user.email };
  sessions.set(token, authUser);

  return res.json({ token, user: authUser });
});

app.post('/api/logout', requireAuth, (req, res) => {
  sessions.delete(req.token);
  res.json({ message: 'Logged out' });
});

app.get('/api/user-data', requireAuth, (req, res) => {
  res.json({ data: req.user });
});

app.get('/api/slides-of-designer', requireAuth, (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const perPage = Math.max(1, Number(req.query.per_page || 10));
  const name = String(req.query.name || '').trim().toLowerCase();

  const db = readDb();
  const filtered = db.slides
    .filter((slide) => !name || slide.slideName.toLowerCase().includes(name))
    .sort((a, b) => a.rank - b.rank);

  const total = filtered.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, lastPage);
  const start = (safePage - 1) * perPage;
  const rows = filtered.slice(start, start + perPage).map(safeSlide);

  res.json({
    data: {
      data: rows,
      current_page: safePage,
      last_page: lastPage,
      total,
      per_page: perPage,
    },
  });
});

app.get('/api/slides/:id', requireAuth, (req, res) => {
  const db = readDb();
  const slide = db.slides.find((row) => row.id === String(req.params.id));
  if (!slide) {
    return res.status(404).json({ message: 'Slide not found' });
  }
  return res.json({
    data: {
      ...safeSlide(slide),
      elements: slide.elements || [],
      screenshot: slide.screenshot || null,
    },
  });
});

app.get('/api/media-of-slide/:slideId', requireAuth, (req, res) => {
  const db = readDb();
  const slide = db.slides.find((row) => row.id === String(req.params.slideId));
  if (!slide) {
    return res.status(404).json({ message: 'Slide not found' });
  }
  return res.json({ data: slide.media || [] });
});

app.post('/api/attach-media-to-slide/:slideId', requireAuth, (req, res) => {
  const db = readDb();
  const slide = db.slides.find((row) => row.id === String(req.params.slideId));
  if (!slide) {
    return res.status(404).json({ message: 'Slide not found' });
  }

  const media = {
    id: `m-${Date.now()}`,
    type: String(req.body?.type || 'image'),
    name: String(req.body?.name || 'Media'),
    url: String(req.body?.url || ''),
    thumbnail: req.body?.thumbnail ? String(req.body.thumbnail) : undefined,
  };

  if (!media.url) {
    return res.status(422).json({ message: 'url is required' });
  }

  slide.media = [...(slide.media || []), media];
  slide.updatedAt = new Date().toISOString();
  writeDb(db);
  return res.status(201).json({ data: media });
});

app.post('/api/save-slide-dummy/:slideId', requireAuth, (req, res) => {
  const db = readDb();
  const slide = db.slides.find((row) => row.id === String(req.params.slideId));
  if (!slide) {
    return res.status(404).json({ message: 'Slide not found' });
  }

  const mode = String(req.body?.mode || '');
  if (mode === 'update_element') {
    const elementId = String(req.body?.elementId || '');
    const updates = req.body?.updates || {};

    if (!elementId) {
      return res.status(422).json({ message: 'elementId is required for update_element mode' });
    }

    const idx = (slide.elements || []).findIndex((item) => item.id === elementId);
    if (idx < 0) {
      slide.elements = [...(slide.elements || []), { id: elementId, ...updates }];
    } else {
      slide.elements[idx] = { ...slide.elements[idx], ...updates };
    }
  } else if (mode === 'sync_elements') {
    if (!Array.isArray(req.body?.elements)) {
      return res.status(422).json({ message: 'elements array is required for sync_elements mode' });
    }
    slide.elements = req.body.elements;
  } else {
    if (typeof req.body?.html === 'string') {
      slide.html = req.body.html;
    }
    if (typeof req.body?.screenshot === 'string') {
      slide.screenshot = req.body.screenshot;
      slide.thumbnail = req.body.screenshot;
    }
    if (Array.isArray(req.body?.elements)) {
      slide.elements = req.body.elements;
    }
  }

  slide.updatedAt = new Date().toISOString();
  writeDb(db);

  return res.json({
    message: 'Slide saved',
    data: {
      id: slide.id,
      updatedAt: slide.updatedAt,
      mode: mode || 'full_save',
    },
  });
});

app.use((_req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

app.listen(PORT, HOST, () => {
  ensureDb();
  console.log(`Backend running on http://${HOST}:${PORT}`);
});
