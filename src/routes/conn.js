require('dotenv').config();
const mongoose = require('mongoose');

mongoose
    .connect(process.env.mongoose, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log("DB Connected");
    })
    .catch((err) => console.log(err));
