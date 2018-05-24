/**
 * Module dependencies.
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
const express = require('express');
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const logger = require('morgan');
const chalk = require('chalk');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv');
// const MongoStore = require('connect-mongo')(session);
const flash = require('express-flash');
const path = require('path');
// const mongoose = require('mongoose');
const passport = require('passport');
const expressValidator = require('express-validator');
const expressStatusMonitor = require('express-status-monitor');
const sass = require('node-sass-middleware');
const multer = require('multer');
const fs = require('fs');
const https = require('https');
const rfs = require('rotating-file-stream');
const engines = require('consolidate');
const jsonServer = require('json-server');
const fsAPI = require('fs-rest-api');
const request = require('request');
const serveIndex = require('serve-index');
const sizeOf = require('image-size');
const gm = require('gm').subClass({imageMagick: true});
// const images = require("images");

const jsonRouter = jsonServer.router(path.join(__dirname, 'db.json'));
const jsonMiddlewares = jsonServer.defaults();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  // dest: path.join(__dirname, 'uploads'), 
  fileFilter: (req, file, cb) => {
    console.log('file', file);
    // console.log('req', req);
    // To reject this file pass `false`, like so:
    if(!file.mimetype.includes('image')) {
      console.log('file type not supported');
      cb(null, false);
    }
    // To accept the file pass `true`, like so:
    else cb(null, true);
  
    // You can always pass an error if something goes wrong:
    // cb(new Error('System error!'));
  }
});

const logDirectory = path.join(__dirname, 'log');
const accessLogStream = rfs('access.log', {
  size: '50M', // rotate every 10 MegaBytes written
  interval: '1d', // rotate daily
  compress: 'gzip',
  path: logDirectory
});

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.load({ path: '.env' });

/**
 * Controllers (route handlers).
 */
const homeController = require('./controllers/home');
const userController = require('./controllers/user');
const apiController = require('./controllers/api');
const contactController = require('./controllers/contact');

/**
 * API keys and Passport configuration.
 */
const passportConfig = require('./config/passport');

/**
 * Create Express server.
 */
const app = express();
const router = express.Router();
router.get('/', (req, res) => {});
app.use('/sub', router);

/**
 * Connect to MongoDB.
 */
// mongoose.connect(process.env.MONGODB_URI);
// mongoose.connection.on('error', (err) => {
//   console.error(err);
//   console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
//   process.exit();
// });

/**
 * Express configuration.
 */
app.set('host', process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0');
app.set('port', process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.engine('pug', engines.pug);
app.engine('ejs', engines.ejs);
app.engine('html', engines.ejs);
app.use(expressStatusMonitor());
app.use(compression());
app.use(sass({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public')
}));
// app.use(logger('dev'));
app.use(logger('combined', { stream: accessLogStream }));
app.use(bodyParser({
  uploadDir: `${__dirname}/uploads`,
  keepExtensions: true,
  limit: '50mb'
}));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(expressValidator());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  cookie: { maxAge: 1209600000 }, // two weeks in milliseconds
  // store: new MongoStore({
  //   url: process.env.MONGODB_URI,
  //   autoReconnect: true,
  // })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
// app.use((req, res, next) => {
//   if (req.path === '/api/upload' || req.path.includes('/json/') || req.path.includes('/fs/')
//   || /\/api\/images(\/)?(\d)?/.test(req.path) || req.path.includes('/api/users')
//   || req.path.includes('/api/uploadImages') || req.path.includes('/api/like') || req.path.includes('/api/unlike')) {
//     next();
//   } else {
//     lusca.csrf()(req, res, next);
//   }
// });
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.user &&
    req.path !== '/login' &&
    req.path !== '/signup' &&
    !req.path.match(/^\/auth/) &&
    !req.path.match(/\./)) {
    req.session.returnTo = req.originalUrl;
  } else if (req.user &&
    (req.path === '/account' || req.path.match(/^\/api/))) {
    req.session.returnTo = req.originalUrl;
  }
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));
app.use('/view/images', express.static('uploads'), serveIndex('uploads', { icons: true }));

/**
 * Primary app routes.
 */
app.get('/', homeController.index);
app.get('/login', userController.getLogin);
app.post('/login', userController.postLogin);
app.get('/logout', userController.logout);
app.get('/forgot', userController.getForgot);
app.post('/forgot', userController.postForgot);
app.get('/reset/:token', userController.getReset);
app.post('/reset/:token', userController.postReset);
app.get('/signup', userController.getSignup);
app.post('/signup', userController.postSignup);
app.get('/contact', contactController.getContact);
app.post('/contact', contactController.postContact);
app.get('/account', passportConfig.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConfig.isAuthenticated, userController.postUpdateProfile);
app.post('/account/password', passportConfig.isAuthenticated, userController.postUpdatePassword);
app.post('/account/delete', passportConfig.isAuthenticated, userController.postDeleteAccount);
app.get('/account/unlink/:provider', passportConfig.isAuthenticated, userController.getOauthUnlink);

/**
 * API examples routes.
 */
app.get('/api', apiController.getApi);
app.get('/api/lastfm', apiController.getLastfm);
app.get('/api/nyt', apiController.getNewYorkTimes);
app.get('/api/aviary', apiController.getAviary);
app.get('/api/steam', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getSteam);
app.get('/api/stripe', apiController.getStripe);
app.post('/api/stripe', apiController.postStripe);
app.get('/api/scraping', apiController.getScraping);
app.get('/api/twilio', apiController.getTwilio);
app.post('/api/twilio', apiController.postTwilio);
app.get('/api/clockwork', apiController.getClockwork);
app.post('/api/clockwork', apiController.postClockwork);
app.get('/api/foursquare', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFoursquare);
app.get('/api/tumblr', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getTumblr);
app.get('/api/facebook', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFacebook);
app.get('/api/github', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getGithub);
app.get('/api/twitter', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getTwitter);
app.post('/api/twitter', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.postTwitter);
app.get('/api/linkedin', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getLinkedin);
app.get('/api/instagram', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getInstagram);
app.get('/api/paypal', apiController.getPayPal);
app.get('/api/paypal/success', apiController.getPayPalSuccess);
app.get('/api/paypal/cancel', apiController.getPayPalCancel);
app.get('/api/lob', apiController.getLob);
app.get('/api/upload', apiController.getFileUpload);
const cpUpload = upload.fields([{ name: 'myFile', maxCount: 1 }, { name: 'photos', maxCount: 5 }]);
app.post('/api/upload', cpUpload, apiController.postFileUpload);
app.get('/api/pinterest', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getPinterest);
app.post('/api/pinterest', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.postPinterest);
app.get('/api/google-maps', apiController.getGoogleMaps);


app.get('/api/images', (req, res) => {
  let url = '';
  if (req.query && req.query.page) {
    url = `${req.protocol}://${req.headers.host}/json/images?_page=${req.query.page}&_limit=10&_sort=count,createDate&_order=desc,desc&_embed=votes`;
  } else {
    url = `${req.protocol}://${req.headers.host}/json/images?_sort=count,createDate&_order=desc,desc&_embed=votes`;
  }
  if (req.query && req.query.q) {
    url += `&q=${req.query.q}`;
  }
  return request({
    url,
    method: 'get',
    // credentials: 'include', //same-origin
    timeout: 1000 * 10,
    agent: false,
    pool: { maxSockets: 100 },
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json; charset=utf-8'
    }
  }, async (error, response, body) => {
    // console.log(error, response, body); // eslint-disable-line
    let data = JSON.parse(body);
    const openId = req.query.open_id;
    if (openId) {
      const user = await (
        () => new Promise((resolve, reject) => {
          request({
            url: `${req.protocol}://${req.headers.host}/json/users?q=${openId}`,
            method: 'get',
            // credentials: 'include', //same-origin
            timeout: 1000 * 10,
            agent: false,
            pool: { maxSockets: 100 },
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json; charset=utf-8'
            },
            json: true
          }, (error, response, body) => {
            if (error) {
              reject(error);
            }
            // console.log(error, response, body);
            resolve(body && body[0]);
          });
        })
      )();
      // console.log(user);
      if (user) {
        data = data.map((item) => {
          const newItem = {
            ...item,
            voted: item.votes.filter(it => it.userId === user.id).length > 0
          };
          delete newItem.votes;
          return newItem;
        });
      } else {
        data = data.map((item) => {
          const newItem = {
            ...item,
            voted: false
          };
          delete newItem.votes;
          return newItem;
        });
      }
    }
    res.json(data);
  });
});
app.get('/api/images/:image_id', (req, res) => {
  let url = `${req.protocol}://${req.headers.host}/json/images?_expand=user&_embed=votes&id=${req.params.image_id}`;
  if (req.query && req.query.q) {
    url += `&q=${req.query.q}`;
  }
  return request({
    url,
    method: 'get',
    // credentials: 'include', //same-origin
    timeout: 1000 * 10,
    agent: false,
    pool: { maxSockets: 100 },
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json; charset=utf-8'
    }
  }, (error, response, body) => {
    // console.log(error, response, body); // eslint-disable-line
  }).pipe(res);
});
app.delete('/api/images/:image_id', (req, res) => {
  const url = `${req.protocol}://${req.headers.host}/json/images/${req.params.image_id}`;
  return request({
    url,
    method: 'delete',
    // credentials: 'include', //same-origin
    timeout: 1000 * 10,
    agent: false,
    pool: { maxSockets: 100 },
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json; charset=utf-8'
    }
  }, (error, response, body) => {
    // console.log(error, response, body); // eslint-disable-line
  }).pipe(res);
});
app.post('/api/uploadImages(/)?:open_id?', cpUpload, (req, res, next) => {
  const url = `${req.protocol}://${req.headers.host}/json/`;
  const file = req.files && req.files.myFile && req.files.myFile[0];
  const { photos } = req.files;
  // console.log(photos);
  // console.log(req.body);

  if (file) {
    // console.log('文件类型：%s', file.mimetype);
    // console.log('原始文件名：%s', file.originalname);
    // console.log('文件大小：%s', file.size);
    // console.log('文件保存路径：%s', file.path);
    sizeOf(file.path, async (err, dimensions) => {
      if (err) {
        next(err);
      }
      // let filePath = file.path;
      // images(file.path)                     //Load image from file 
      //   .size(200)                          //Geometric scaling the image to 400 pixels width
      //   .save("output.jpg", {               //Save the image to a file, with the quality of 50
      //     quality: 50                    //保存图片到文件,图片质量为50
      //   });
      const open_id = req.params.open_id || req.query.open_id || req.body.open_id || 'pppppp';
      let user = await (
        () => new Promise((resolve, reject) => {
          request({
            url: `${url}users?q=${open_id}`,
            method: 'get',
            // credentials: 'include', //same-origin
            timeout: 1000 * 10,
            agent: false,
            pool: { maxSockets: 100 },
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json; charset=utf-8'
            },
            json: true
          }, (error, response, body) => {
            if (error) {
              reject(error);
            }
            // console.log(error, response, body);
            resolve(body && body[0]);
          });
        })
      )();
      // console.log(user);
      if (!user) {
        user = await (
          () => new Promise((resolve, reject) => {
            request({
              url: `${req.protocol}://${req.headers.host}/api/users`,
              method: 'post',
              // credentials: 'include', //same-origin
              timeout: 1000 * 10,
              agent: false,
              pool: { maxSockets: 100 },
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json; charset=utf-8'
              },
              body: {
                name: `${Date.now()}`,
                open_id
              },
              json: true
            }, (error, response, body) => {
              if (error) {
                reject(error);
              }
              console.log(body);
              resolve(body);
            });
          })
        )();
        console.log('user', user);
      }
      console.log(user);
      let body = req.body || {};
      // console.log(dimensions.width, dimensions.height);
      body = {
        ...body,
        ...{
          // mimetype: file.mimetype,
          // originalname: file.originalname,
          // width: dimensions.width,
          // height: dimensions.height,
          createDate: Date.now(),
          path: file.filename,
          count: 0,
          userId: user.id
        }
      };

      request({
        method: 'post',
        url: `${url}images`,
        body,
        headers: {
          'content-type': 'application/json',
        },
        json: true,
      }, (error, response, body) => {
        if (error) {
          next(error);
        }
        let readStream = fs.createReadStream(file.path);
        gm(readStream)
          .size({ bufferStream: true }, function (err, size) {
            console.log(err);
            if(!err){
              this.resize(360, 360);  // size.width / 2, size.height / 2);
              this.write(path.join(__dirname, 'uploads', 'thumbs', `thumb_${file.filename}`), function (err) {
                if (!err) console.log('done');
              });
            }
          });
        // console.log(error, response, body); // eslint-disable-line
      }).pipe(res);
    });
  } else {
    next();
  }
});

app.post('/api/like', async (req, res, next) => {
  const url = `${req.protocol}://${req.headers.host}/json/`;
  const { open_id, image_id } = req.query;
  let user, vote, image;
  user = await (() => {
    return new Promise((resolve, reject) => {
      request({
        url: `${url}users?q=${open_id}`,
        method: 'get',
        // credentials: 'include', //same-origin
        timeout: 1000 * 10,
        agent: false,
        pool: { maxSockets: 100 },
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json; charset=utf-8'
        },
        json: true
      }, (error, response, body) => {
        if (error) {
          reject(error);
        }
        // console.log(error, response, body);
        resolve(body && body[0]);
      });
    });
  })();
  // console.log(user);
  if (!user) {
    user = await (
      () => new Promise((resolve, reject) => {
        request({
          url: `${req.protocol}://${req.headers.host}/api/users`,
          method: 'post',
          // credentials: 'include', //same-origin
          timeout: 1000 * 10,
          agent: false,
          pool: { maxSockets: 100 },
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json; charset=utf-8'
          },
          body: {
            name: `${Date.now()}`,
            open_id
          },
          json: true
        }, (error, response, body) => {
          if (error) {
            reject(error);
          }
          console.log(body);
          resolve(body);
        });
      })
    )();
    console.log('user', user);
  }
  vote = await (() => {
    return new Promise((resolve, reject) => {
      request({
        url: `${url}votes?userId=${user.id}&imageId=${image_id}`,
        method: 'get',
        // credentials: 'include', //same-origin
        timeout: 1000 * 10,
        agent: false,
        pool: { maxSockets: 100 },
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json; charset=utf-8'
        },
        json: true
      }, (error, response, body) => {
        if (error) {
          reject(error);
        }
        // console.log(error, response, body);
        resolve(body && body[0]);
      });
    });
  })();
  // console.log(vote);
  if (!vote) {
    image = await (() => {
      return new Promise((resolve, reject) => {
        request({
          url: `${req.protocol}://${req.headers.host}/api/images/${image_id}`,
          method: 'get',
          // credentials: 'include', //same-origin
          timeout: 1000 * 10,
          agent: false,
          pool: { maxSockets: 100 },
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json; charset=utf-8'
          },
          json: true
        }, (error, response, body) => {
          if (error) {
            reject(error);
          }
          // console.log(error, response, body);
          resolve(body && body[0]);
        });
      });
    })();
    if (!image) {
      return res.status(500).json({ error: '图片不存在！' });
    }
    delete image['votes'];
    delete image['user'];
    request({
      method: 'put',
      url: `${url}images/${image.id}`,
      body: {
        ...image,
        count: image.count+1
      },
      headers: {
        'content-type': 'application/json',
      },
      json: true,
    }, (error, response, body) => {
      if (error) {
        next(error);
      }
      // console.log(error, response, body); // eslint-disable-line
    });
    request({
      method: 'post',
      url: `${url}votes`,
      body: {
        userId: user.id,
        imageId: image_id * 1
      },
      headers: {
        'content-type': 'application/json',
      },
      json: true,
    }, (error, response, body) => {
      if (error) {
        next(error);
      }
      // console.log(error, response, body); // eslint-disable-line
    }).pipe(res);
  } else {
    return res.status(500).json({error: '不能重复点赞！'});
  }
});
app.post('/api/unlike', async (req, res, next) => {
  const url = `${req.protocol}://${req.headers.host}/json/`;
  const { open_id, image_id } = req.query;
  let user, vote, image;
  user = await (() => {
    return new Promise((resolve, reject) => {
      request({
        url: `${url}users?q=${open_id}`,
        method: 'get',
        // credentials: 'include', //same-origin
        timeout: 1000 * 10,
        agent: false,
        pool: { maxSockets: 100 },
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json; charset=utf-8'
        },
        json: true
      }, (error, response, body) => {
        if (error) {
          reject(error);
        }
        // console.log(error, response, body);
        resolve(body && body[0]);
      });
    });
  })();
  // console.log(user);
  if (!user) {
    return res.status(500).json({ error: '用户不存在' });
  }
  image = await (() => {
    return new Promise((resolve, reject) => {
      request({
        url: `${req.protocol}://${req.headers.host}/api/images/${image_id}`,
        method: 'get',
        // credentials: 'include', //same-origin
        timeout: 1000 * 10,
        agent: false,
        pool: { maxSockets: 100 },
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json; charset=utf-8'
        },
        json: true
      }, (error, response, body) => {
        if (error) {
          reject(error);
        }
        // console.log(error, response, body);
        resolve(body && body[0]);
      });
    });
  })();
  if (!image) {
    return res.status(500).json({ error: '图片不存在！' });
  }
  delete image['votes'];
  delete image['user'];
  request({
    method: 'put',
    url: `${url}images/${image.id}`,
    body: {
      ...image,
      count: image.count <= 1 ? 0 : --image.count
    },
    headers: {
      'content-type': 'application/json',
    },
    json: true,
  }, (error, response, body) => {
    if (error) {
      next(error);
    }
    // console.log(error, response, body); // eslint-disable-line
  });
  vote = await (() => {
    return new Promise((resolve, reject) => {
      request({
        url: `${url}votes?userId=${user.id}&imageId=${image_id}`,
        method: 'get',
        // credentials: 'include', //same-origin
        timeout: 1000 * 10,
        agent: false,
        pool: { maxSockets: 100 },
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json; charset=utf-8'
        },
        json: true
      }, (error, response, body) => {
        if (error) {
          reject(error);
        }
        // console.log(error, response, body);
        resolve(body && body[0]);
      });
    });
  })();
  // console.log(vote);
  if (!vote) {
    return res.status(500).json({ error: '出错了' });
  }
  request({
    method: 'delete',
    url: `${url}votes/${vote.id}`,
    headers: {
      'content-type': 'application/json',
    },
    json: true,
  }, (error, response, body) => {
    if (error) {
      next(error);
    }
    // console.log(error, response, body); // eslint-disable-line
  }).pipe(res);
});

app.post('/api/users(/)?:open_id?', async (req, res, next) => {
  const url = `${req.protocol}://${req.headers.host}/json/users`;
  let user;
  user = await (() => {
    return new Promise((resolve, reject) => {
      request({
        url: `${url}?q=${req.params.open_id || req.body.open_id || req.query.open_id || -1}`,
        method: 'get',
        // credentials: 'include', //same-origin
        timeout: 1000 * 10,
        agent: false,
        pool: { maxSockets: 100 },
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json; charset=utf-8'
        },
        json: true
      }, (error, response, body) => {
        if (error) {
          reject(error);
        }
        // console.log(error, response, body);
        resolve(body && body[0]);
      });
    });
  })();
  // console.log(user);
  if (!user) {
    request({
      method: 'post',
      url,
      body: {
        open_id: req.params.open_id || req.body.open_id || req.query.open_id || -1,
        ...req.body
      },
      headers: {
        'content-type': 'application/json',
      },
      json: true,
    }, (error, response, body) => {
      if (error) {
        next(error);
      }
      // console.log(error, response, body); // eslint-disable-line
    }).pipe(res);
  } else {
    request({
      method: 'put',
      url: `${req.protocol}://${req.headers.host}/api/users/${req.params.open_id || req.body.open_id || req.query.open_id || -1}`,
      body: {
        ...user,
        ...req.body,
        open_id: req.params.open_id || req.body.open_id || req.query.open_id || -1
      },
      headers: {
        'content-type': 'application/json',
      },
      json: true,
    }, (error, response, body) => {
      if (error) {
        next(error);
      }
      // console.log(error, response, body); // eslint-disable-line
    }).pipe(res);
  }
});
app.put('/api/users/:open_id', async (req, res, next) => {
  const url = `${req.protocol}://${req.headers.host}/json/users`;
  let user = await (() => {
    return new Promise((resolve, reject) => {
      request({
        url: `${url}?q=${req.params.open_id}`,
        method: 'get',
        // credentials: 'include', //same-origin
        timeout: 1000 * 10,
        agent: false,
        pool: { maxSockets: 100 },
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json; charset=utf-8'
        },
        json: true
      }, (error, response, body) => {
        if (error) {
          reject(error);
        }
        // console.log(error, response, body);
        resolve(body && body[0]);
      });
    });
  })();
  // console.log(user);
  if (!user) {
    return res.status(500).json({ error: '用户不存在' });
  }
  request({
    method: 'put',
    url: `${url}/${user.id}`,
    body: {
      ...user,
      ...req.body,
      open_id: req.params.open_id || req.body.open_id || req.query.open_id || -1
    },
    headers: {
      'content-type': 'application/json',
    },
    json: true,
  }, (error, response, body) => {
    if (error) {
      return res.status(500).json({ error: JSON.stringify(error) });
    }
    // console.log(error, response, body); // eslint-disable-line
  }).pipe(res);
});
app.get('/api/users', (req, res) => {
  let url = `${req.protocol}://${req.headers.host}/json/users`;
  if (req.query && req.query.q) {
    url += `?q=${req.query.q}`;
  }
  return request({
    url,
    method: 'get',
    // credentials: 'include', //same-origin
    timeout: 1000 * 10,
    agent: false,
    pool: { maxSockets: 100 },
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json; charset=utf-8'
    }
  }, (error, response, body) => {
    // console.log(error, response, body); // eslint-disable-line
  }).pipe(res);
});
app.get('/api/users/:open_id', (req, res) => {
  let url = `${req.protocol}://${req.headers.host}/json/users?_embed=votes&_embed=images&open_id=${req.params.open_id}`;
  if (req.query && req.query.q) {
    url += `&q=${req.query.q}`;
  }
  return request({
    url,
    method: 'get',
    // credentials: 'include', //same-origin
    timeout: 1000 * 10,
    agent: false,
    pool: { maxSockets: 100 },
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json; charset=utf-8'
    }
  }, (error, response, body) => {
    // console.log(error, response, body); // eslint-disable-line
  }).pipe(res);
});

app.get('/api/wechat/open_id', (req, res, next) => {
  let { code } = req.query;
  // official wx3cac99d02c940f34
  // official ac040517ce98a9e820f20f50dc78b78b
  let url = 'https://api.weixin.qq.com/sns/jscode2session?appid=wx3cac99d02c940f34&secret=ac040517ce98a9e820f20f50dc78b78b&js_code={JSCODE}&grant_type=authorization_code';
  url = url.replace('{JSCODE}', code);
  request.get(url, (err, reqst, body) => {
    if (err) { return next(err); }
    return res.send(body);
  });
});

/**
 * OAuth authentication routes. (Sign in)
 */
app.get('/auth/instagram', passport.authenticate('instagram'));
app.get('/auth/instagram/callback', passport.authenticate('instagram', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'public_profile'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/github', passport.authenticate('github'));
app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/linkedin', passport.authenticate('linkedin', { state: 'SOME STATE' }));
app.get('/auth/linkedin/callback', passport.authenticate('linkedin', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});

/**
 * OAuth authorization routes. (API examples)
 */
app.get('/auth/foursquare', passport.authorize('foursquare'));
app.get('/auth/foursquare/callback', passport.authorize('foursquare', { failureRedirect: '/api' }), (req, res) => {
  res.redirect('/api/foursquare');
});
app.get('/auth/tumblr', passport.authorize('tumblr'));
app.get('/auth/tumblr/callback', passport.authorize('tumblr', { failureRedirect: '/api' }), (req, res) => {
  res.redirect('/api/tumblr');
});
app.get('/auth/steam', passport.authorize('openid', { state: 'SOME STATE' }));
app.get('/auth/steam/callback', passport.authorize('openid', { failureRedirect: '/api' }), (req, res) => {
  res.redirect(req.session.returnTo);
});
app.get('/auth/pinterest', passport.authorize('pinterest', { scope: 'read_public write_public' }));
app.get('/auth/pinterest/callback', passport.authorize('pinterest', { failureRedirect: '/login' }), (req, res) => {
  res.redirect('/api/pinterest');
});

/**
 * Error Handler.
 */
if (process.env.NODE_ENV === 'development') {
  // only use in development
  app.use(errorHandler());
}

/**
 * Start Express server.
 */
const server = app.listen(app.get('port'), () => {
  console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
  console.log('  Press CTRL-C to stop\n');
});

let httpsServer;
if (process.env.npm_config_mode === 'ssl' || process.argv.slice(2)[0] === 'ssl') {
  const options = {
    key: fs.readFileSync('./server/keys/1526821422754.key'),
    // ca: [fs.readFileSync('./server/keys/ca.crt')],
    cert: fs.readFileSync('./server/keys/1526821422754.pem')
  };
  httpsServer = https.createServer(options, app).listen(8081, () => {
    // res.writeHead(200);
    console.log('%s Express server listening on port %d in %s mode.', chalk.green('✓'), 8081, app.get('env'));
  });


  // https://localhost:8081/fs/stat?path=1525593259617-timg.jfif
  // https://localhost:8081/fs/tree
  // https://localhost:8081/fs/read?path=1525593259617-timg.jfif
  // https://localhost:8081/fs/write?path=filename&contents=base64
  // https://localhost:8081/fs/remove?path=1525593259617-timg.jfif
  // http://localhost:9090/api/images?_expand=user&_embed=votes&_page=1&_limit=10&_sort=count&_order=desc

}
app.use(jsonMiddlewares);
app.use('/json', jsonRouter);
app.use('/fs', fsAPI(path.join(__dirname, './uploads')));

process.umask(0);

module.exports = server;
