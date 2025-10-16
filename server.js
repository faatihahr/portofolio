const pool = require('./db/config');
const express = require('express');
const app = express();
const { engine } = require('express-handlebars');
const port = 3000;
const upload = require('./storage/storage');
const dataHandler = require('./dataHandler');
const path = require('path');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');

// Set up Handlebars as the view engine
app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials'),
    helpers: {
    split: function(str, sep) {
      if (!str) return [];
      return str.split(sep);
    },
    formatDate: function(dateString) {
          if (!dateString) return '';
          const date = new Date(dateString);
          return new Intl.DateTimeFormat('en-US', {
              year: '2-digit',
              month: '2-digit',
              day: '2-digit'
          }).format(date);
    },
    eq: function(a, b) {
      return a === b;
    }
  }
}));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/upload', express.static(path.join(__dirname, 'upload')));

// Logging middleware
app.use((req, res, next) => {
  const now = new Date();
  console.log(`[${now.toISOString()}] ${req.method} ${req.url}`);
  next();
});

//Cookie parser middleware
app.use(cookieParser());

// Middleware session
app.use(session({
  secret: 'secretKey123',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
}));

// Middleware untuk cek admin
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  if (req.xhr || req.headers.accept.indexOf('json') > -1) {
    return res.status(403).json({ message: 'Akses ditolak. Silakan login kembali.' });
  }
  res.redirect('/login');
}


// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//index route
app.get('/', async (req, res) => {
  const projects = await dataHandler.getAllProjects();
  const experiences = await dataHandler.getAllExperiences();
  res.render('index', {
    title: 'Faatihah Rahmatillah Portfolio',
    projects,
    experiences
  });
});

// Login routes
app.get('/login', (req, res) => {
  res.render('login', { layout: false, title: 'Login ', activePage: 'login' });
});

async function getAdmin(username) {
  const res = await pool.query('SELECT * FROM "user" WHERE username = $1', [username]);
  return res.rows[0];
}

async function verifyLogin(req, res, next) {
  const { username, password } = req.body;

  try {
    const admin = await getAdmin(username);

    if (!admin) {
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(401).json({ error: 'username tidak ditemukan!' });
      } else {
        return res.render('login', {
          title: 'Login',
          error: 'username tidak ditemukan!',
          activePage: 'login',
          layout: false
        });
      }
    }

    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) {
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(401).json({ error: 'password salah!' });
      } else {
        return res.render('login', {
          title: 'Login',
          error: 'password salah!',
          activePage: 'login',
          layout: false
        });
      }
    }

    // Simpan session login
    req.session.isAdmin = true;
    req.session.username = username;
    next();

  } catch (err) {
    console.error('Error di middleware verifyLogin:', err);
    res.status(500).send('Internal Server Error');
    }
  }

// Proses login
app.post('/login', verifyLogin, (req, res) => {
  res.redirect('/dashboard');
});

// Dashboard routes
app.get("/dashboard", requireAdmin, async (req, res) => {
  const projects = await dataHandler.getAllProjects();
  const experiences = await dataHandler.getAllExperiences();
  res.render("dashboard", { layout: false, title: "Dashboard", username: req.session.username || "Admin", projects: projects, experiences: experiences });
});

// Add project form routes button ind dashboard
app.get("/dashboard/project/add", requireAdmin, (req, res) => {
  res.render("project-form", { layout: false, title: "Tambah Proyek Baru" });
});

//project form routes
app.get("/project-form", requireAdmin, (req, res) => {
  res.render("project-form", { layout: false, title: "Tambah Proyek Baru" });
});

// Proses tambah project
app.post("/dashboard/project/add", requireAdmin, upload.single('image'), async (req, res) => {
  const image = req.file ? '/upload/' + req.file.filename : '';
  await dataHandler.createProject({ ...req.body, image });
  res.redirect("/dashboard");
});

// Tampilkan form edit project
app.get('/dashboard/project/detail/:id', requireAdmin, async (req, res) => {
  const project = await dataHandler.getProjectById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json(project);
});

// Proses update project
app.post('/dashboard/project/update/:id', requireAdmin, upload.single('image'), async (req, res) => {
  const image = req.file ? '/upload/' + req.file.filename : req.body.oldImage;
  await dataHandler.updateProject(req.params.id, { ...req.body, image });
  res.json({ message: 'Proyek berhasil diperbarui' });
});

// Delete project
app.post('/dashboard/project/delete/:id', requireAdmin, async (req, res) => {
  await dataHandler.deleteProject(req.params.id);
  res.json({ message: 'Proyek berhasil dihapus' });
});

//experience form routes
app.get("/experience-form", requireAdmin, (req, res) => {
  res.render("experience-form", { layout: false, title: "Tambah Pengalaman Baru" });
});

// Add experience form routes button in dashboard
app.get("/dashboard/experience/add", requireAdmin, (req, res) => {
  res.render("experience-form", { layout: false, title: "Tambah Pengalaman Baru" });
});

// Proses tambah experience
app.post("/dashboard/experience/add", requireAdmin, upload.single('logo'), async (req, res) => {
  const logo = req.file ? '/upload/' + req.file.filename : '';

  let skills = req.body.skills;
  if (Array.isArray(skills)) skills = skills.join(',');
  await dataHandler.createExperience({ ...req.body, logo, skills });
  res.redirect("/dashboard");
});

// Tampilkan form edit experience
app.get('/dashboard/experience/detail/:id', requireAdmin, async (req, res) => {
  const experience = await dataHandler.getExperienceById(req.params.id);
  if (!experience) return res.status(404).json({ message: 'Experience not found' });
  res.json(experience);
})

// Proses update experience
app.post('/dashboard/experience/update/:id', requireAdmin, upload.single('logo'), async (req, res) => {
  const logo = req.file ? '/upload/' + req.file.filename : req.body.oldLogo;
  let skills = req.body.skills;
  if (Array.isArray(skills)) skills = skills.join(',');
  await dataHandler.updateExperience(req.params.id, { ...req.body, logo, skills });
  res.json({ message: 'Pengalaman berhasil diperbarui' });
});

// Delete experience dari DB
app.post('/dashboard/experience/delete/:id', requireAdmin, async (req, res) => {
  await dataHandler.deleteExperience(req.params.id);
  res.json({ message: 'Pengalaman berhasil dihapus' });
});

// Proses logout
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.error('Error saat logout:', err);
    res.clearCookie('isAdmin');
    res.redirect('/');
  });
});

// 404 dan 500 error handler
app.use((req, res, next) => {
  res.status(404).send('<h1>404 - Page Not Found</h1>');
});
app.use((err, req, res, next) => {
  console.error('Internal Server Error:', err);
  res.status(500).send('<h1>500 - Internal Server Error</h1>');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
    pool.query('SELECT NOW()', (err, result) => {
    if (err) {
      console.error('❌ Database connection failed:', err.message);
    } else {
      console.log('✅ Database connected! Current time:', result.rows[0].now);
    }
  });
});
