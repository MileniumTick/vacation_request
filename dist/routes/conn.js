require('dotenv').config();
var mongoose = require('mongoose');
mongoose
    .connect(process.env.mongoose, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(function () {
    console.log("DB Connected");
})
    .catch(function (err) { return console.log(err); });
