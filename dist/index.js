var express = require("express");
var app = express();
var port = 3300;
var session = require("express-session");
var patch = require('path');
var url = 'localhost:3300';
require("./routes/conn");
// Static Files
app.use(express.static(patch.join(__dirname, 'public')));
app.use(express.static(patch.join(__dirname, 'uploads')));
// Templating Engine
app.set("views", "./src/views");
app.set("view engine", "ejs");
// Parsing middleware
var bodyParsers = require("express").json;
app.use(bodyParsers());
app.use(session({
    secret: "my secret key",
    saveUninitialized: true,
    resave: false,
}));
app.use(function (req, res, next) {
    res.locals.message = req.session.message;
    delete req.session.message;
    next();
});
app.use(function (req, res, next) {
    res.locals.login = req.session.login;
    next();
});
// Routes
var newsRouter = require("./api/user");
var res = require("express/lib/response");
app.use("/", newsRouter);
app.use("/user", newsRouter);
app.get("/", function (req, res) {
    if (req.session.login) {
        res.redirect("/user/".concat(req.session.login));
    }
    else {
        res.render("index", { Title: "This is text" });
        console.log(req.session.login);
    }
});
// Listen on port 3300
app.listen(port, function () { return console.log("Listening on port ".concat(url)); });
module.exports = app;
