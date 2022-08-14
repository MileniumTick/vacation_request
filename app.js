const express = require("express");
const app = express();
const port = 3300;
const bodyParser = require("body-parser");
const session = require("express-session");
const patch = require('path');
const nodemailer = require("nodemailer");

require("./routes/conn");

// Static Files
app.use(express.static(patch.join(__dirname, 'public')));
app.use(express.static(patch.join(__dirname, 'uploads')));


// Templating Engine
app.set("views", "./views");
app.set("view engine", "ejs");

// Parsing middleware
const bodyParsers = require("express").json;
app.use(bodyParsers());


app.use(
    session({
        secret: "my secret key",
        saveUninitialized: true,
        resave: false,
    })
);

app.use((req, res, next) => {
    res.locals.message = req.session.message;
    delete req.session.message;
    next();
});

app.use((req, res, next) => {
    res.locals.login = req.session.login;
    next();
});

// Routes
const newsRouter = require("./api/user");

app.use("/", newsRouter);
app.use("/user", newsRouter);

app.get("/", (req, res) => {
    if (req.session.login) {
        res.redirect(`/user/${req.session.login}`)
    } else {
        res.render("index", { Title: "This is text" });
        console.log(req.session.login)
    }
});


// Listen on port 3300
app.listen(port, () => console.log(`Listening on port http://localhost:${port}`));