const path = require("path");
const express = require("express");
const multer = require('multer');
// const bcrypt = require('bcryptjs');

const session = require('express-session');
const csrf = require('csurf');
require('dotenv').config();



const app = express();
const csrfProtection = csrf();
app.use(express.json({ limit: '500mb' }));

app.set("view engine", "ejs");
app.set("views", "views");

const bodyParser = require('body-parser');
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

app.use(session({
  secret: 'my secret for depa',
  resave: false,
  saveUninitialized: false,
}))

app.use(csrfProtection);
// app.use((err, req, res, next) => {
//   if (err.code === 'EBADCSRFTOKEN') {
//     res.status(403).send('Invalid CSRF token');
//   } else {
//     next(err);
//   }
// });

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.user = req.session.user;
  next();
})
const authRoute = require("./routes/auth");
const mainRoute = require("./routes/main");
const adminRoute = require("./routes/admin.js");
const cityRoute = require("./routes/city");
const formRoute = require("./routes/form.js");
const fileUplaod=require("./routes/file.js")
const uploadroutes = require("./routes/uploadRoutes.js");

app.use(authRoute,csrfProtection);
app.use(mainRoute);
app.use(formRoute);
app.use(fileUplaod)
app.use("/admin", adminRoute);
app.use("/city", cityRoute);
app.use("/upload", uploadroutes);


    app.listen(process.env.PORT, () => {
      console.log(`depa-SmartCity-WebTracking is running on port 8888`);
      console.log("******************************");
    });
