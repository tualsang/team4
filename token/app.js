const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const itemRoutes = require('./routes/itemRoutes');
const userRoutes = require('./routes/userRoutes');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const MemoryStore = require('memorystore')(session);
const flash = require('connect-flash');
const methodOverride = require('method-override');

const app = express();

function setupSession(app) {
  if (process.env.NODE_ENV !== 'test') {
    app.use(
      session({
        secret: 'your-secret-key',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
          mongoUrl:
            'mongodb+srv://ddavidbo17:admin123@cluster0.3x8oj.mongodb.net/demos?retryWrites=true&w=majority&appName=Cluster0',
        }),
      })
    );
  } else {
    app.use(
      session({
        secret: 'test-secret-key',
        resave: false,
        saveUninitialized: false,
        store: new MemoryStore(),
      })
    );
  }
}

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  const mongoUri =
    'mongodb+srv://ddavidbo17:admin123@cluster0.3x8oj.mongodb.net/demos?retryWrites=true&w=majority&appName=Cluster0';

  mongoose
    .connect(mongoUri)
    .then(() => {
      console.log('Connected to MongoDB');
      app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => console.log(err));
}

app.use(express.static('public'));
setupSession(app);
app.use(flash());
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.errorMessages = req.flash('error');
  res.locals.successMessages = req.flash('success');
  next();
});
app.use('/uploads', express.static('public/uploads'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.get('/', (req, res) => {
  res.render('index');
});
app.use('/items', itemRoutes);
app.use('/users', userRoutes);
app.use((req, res, next) => {
  const err = new Error(`Cannot find ${req.originalUrl}`);
  err.status = 404;
  next(err);
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: err,
  });
});

module.exports = app;
