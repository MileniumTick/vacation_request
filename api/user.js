// Imports

const nodemailer = require("nodemailer");
const express = require("express");
const router = express.Router();
const bodyParser = require("express");
const multer = require("multer");
const app = express();
const session = require("express-session");


let urlencodedParser = bodyParser.urlencoded({ extended: false });

// mongoDB user model

const Token = require("../models/token")
const User = require("../models/user");
const Record = require("../models/newrecord");

// Password handler

const crypto = require("crypto");
const bcrypt = require("bcrypt");

// Guardar imagen de usuario en el servidor

let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./uploads");
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    },
});

let upload = multer({
    storage: storage,
}).single("image");

// Cuenta del correo

const emailApp = process.env.outlook_email;
const appPass = process.env.outlook_pass;

let transporter =
    nodemailer.createTransport({
        service: "outlook365",
        host: 'smtp.office365.com',
        port: 587,
        auth: {
            user: emailApp,
            pass: appPass,
        }

    })



// middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


router.use(
    session({
        secret: "Shh, its a secret!",
        saveUninitialized: true,
        resave: false,
    })
);

// Registro de usuario nuevo

router.post("/user/signup", upload, (req, res) => {
    let { name, email, password, ced, phone } = req.body;

    console.log(req.file);


    let img = req.file ? req.file.filename : "default.png"

    console.log(img)
    console.log(req.body)

    name = name.trim();
    email = email.trim();
    password = password.trim();
    ced = ced.trim();
    phone = phone.trim();

    if (name == "" || email == "" || password == "" || ced == "") {
        res.json({
            status: "Failed",
            message: "Empty input fields!",
        });
    } else if (!/^[a-zA-Z ]*$/.test(name)) {
        res.json({
            status: "Failed",
            message: "Invalid name entered",
        });
    } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        req.session.message = {
            message: "El correo ingresado no cumple con el formato",
            status: "danger",
        };
        res.redirect("/");
    } else if (!/^[0-9]+$/.test(ced)) {
        req.session.message = {
            message: "El campo cedula solo admite numeros",
            status: "danger",
        };
        res.redirect("/");
    } else if (!/^[0-9]+$/.test(phone)) {
        req.session.message = {
            message: "El campo telefono solo admite numeros",
            status: "danger",
        };
        res.redirect("/");
    } else if (password.length < 8) {
        req.session.message = {
            message: "La contraseña es muy corta son minimo 8 caracteres",
            status: "danger",
        };
        res.redirect("/");
    } else {
        User.find({ ced })
            .then((result) => {
                if (result.length) {
                    // A user already exists
                    req.session.message = {
                        message: "La cedula ingresada ya existe si ocupa ingresar por favor comunicarse con administrativo",
                        status: "warning",
                    };
                    res.redirect("/");
                } else {
                    User.find({ email })
                        .then((result) => {
                            if (result.length) {
                                // A user already exists

                                req.session.message = {
                                    message: "El correo ingresado ya existe",
                                    status: "warning",
                                };
                                res.redirect("/");
                            } else {
                                // Try to create new user

                                // Password handling
                                const saltRoounds = 10;
                                bcrypt
                                    .hash(password, saltRoounds)
                                    .then((hashedPassword) => {
                                        let tipoUser = "Client";

                                        const newUser = new User({
                                            name,
                                            email,
                                            password: hashedPassword,
                                            ced,
                                            phone,
                                            img,
                                            tipoUser,
                                        });

                                        newUser
                                            .save()
                                            .then((result) => {
                                                // generate token and save
                                                let token = new Token({ _userId: result._id, token: crypto.randomBytes(16).toString('hex') });
                                                token.save(function (err) {
                                                    if (err) {
                                                        return res.status(500).send({ msg: err.message });
                                                    }

                                                    let mailOptions = { from: emailApp, to: email, subject: 'Account Verification Link', text: 'Hello ' + req.body.name + ',\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + result.email + '\/' + token.token + '\n\nThank You!\n' };
                                                    console.log(mailOptions)
                                                    transporter.sendMail(mailOptions,(err) => {
                                                        if (err) {
                                                            return res.status(404).send({ msg: 'Technical Issue!, Please click on resend for verify your Email.' ,err: err.message});
                                                        }
                                                        return res.render('verifing', { properties: 'A verification email has been sent to ' + result.email + '. It will be expire after one day. If you not get verification Email click on resend token.', email: result.email });
                                                    });
                                                });
                                            })
                                            .catch((err) => {
                                                res.send({
                                                    status: "Failed",
                                                    message: "An error ocurred while saving user account!",
                                                });
                                            });
                                    })
                                    .catch((err) => {
                                        res.json({
                                            status: "Failed",
                                            message: "An error ocurred while hashing password!",
                                        });
                                    });
                            }
                        })
                        .catch((err) => {
                            console.log(err);
                            res.json({
                                status: "Failed",
                                message: "An error occurred while checking existing email",
                            });
                        });
                }
            })
            .catch((err) => {
                console.log(err);
                res.json({
                    status: "Failed",
                    message: "An error occurred while checking existing ced",
                });
            });
    }
});

// Reenvio de link para confirmacion de correo

router.get('/resendlink/:email', (req, res, next) => {

    console.log(req.body.email + " " + req.params.email)

    User.findOne({ email: req.params.email }, function (err, user) {
        // user is not found into database
        if (!user) {
            return res.status(400).send({ msg: 'We were unable to find a user with that email. Make sure your Email is correct!' });
        }
        // user has been already verified
        else if (user.isVerified) {
            return res.status(200).send('This account has been already verified. Please log in.');

        }
        // send verification link
        else {
            // generate token and save
            var token = new Token({ _userId: user._id, token: crypto.randomBytes(16).toString('hex') });
            token.save(function (err) {
                if (err) {
                    return res.status(500).send({ msg: err.message });
                }

                // Send email (use verified sender's email address & generated API_KEY on SendGrid)
                var mailOptions = { from: emailApp, to: user.email, subject: 'Account Verification Link', text: 'Hello ' + user.name + ',\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + user.email + '\/' + token.token + '\n\nThank You!\n' };
                transporter.sendMail(mailOptions, function (err) {
                    if (err) {
                        return res.status(500).send({ msg: 'Technical Issue!, Please click on resend for verify your Email.' });
                    }
                    return res.render('/verifing', { properties: 'A verification email has been sent to ' + user.email + '. It will be expire after one day. If you not get verification Email click on resend token.', email: user.email });
                });
            });
        }
    })
});

router.get('/confirmation/:email/:token', (req, res, next) => {
    Token.findOne({ token: req.params.token }, function (err, token) {
        // token is not found into database i.e. token may have expired 
        console.log(req.params.email);
        if (!token) {
            req.session.message = {
                message: "Su link para accesar ya expiro",
                status: "error",
            };
            return res.redirect('/');
        }
        // if token is found then check valid user 
        else {
            User.findOne({ _id: token._userId, email: req.params.email }, function (err, user) {
                // not valid user
                if (!user) {
                    return res.status(401).send({ msg: 'We were unable to find a user for this verification. Please SignUp!' });
                }
                // user is already verified
                else if (user.isVerified) {
                    req.session.message = {
                        message: "Su usuario ya se encuentra verificado",
                        status: "info",
                    };
                    return res.redirect('/');
                }
                // verify user
                else {
                    // change isVerified to true
                    user.isVerified = true;
                    user.save(function (err) {
                        // error occur
                        if (err) {
                            return res.status(500).send({ msg: err.message });
                        }
                        // account successfully verified
                        else {
                            req.session.message = {
                                message: "Se registro el usuario con exito por favor ingresar",
                                status: "success",
                            };
                            return res.redirect('/');
                        }
                    });
                }
            });
        }

    });
});

// Iniciar sesion como usuario

router.post("/user/signin", urlencodedParser, (req, res) => {
    let ced = req.body.ced;
    let email = req.body.email;
    let password = req.body.password;

    if (email == "" || password == "" || ced == "") {
        req.session.message = {
            message: "Los campos se encuentran vacios",
            status: "danger",
        };
        return res.redirect('/');
    } else {
        // Check if user exist
        User.find({ email })
            .then((data) => {
                if (data) {
                    const userLogin = data[0];
                    //User exists
                    const hashedPassword = userLogin.password;

                    bcrypt
                        .compare(password, hashedPassword)
                        .then((result) => {
                            if (result & (userLogin.ced === ced)) {
                                //Password match

                                if (userLogin.isVerified) {
                                    req.session.login = data[0].id;
                                    res.redirect(`/user/${req.session.login}`);
                                } else {
                                    req.session.message = {
                                        message: "Su correo no fue verificado por favor verfiquelo antes de ingresar",
                                        status: "info",
                                    };
                                    return res.redirect('/');
                                }
                            } else {
                                req.session.message = {
                                    message: "Su contraseña o cedula no coinciden",
                                    status: "danger",
                                };
                                return res.redirect('/');
                            }
                        })
                        .catch((err) => {
                            req.session.message = {
                                message: "Ocurrio un error al comparar su contraseña",
                                status: "warning",
                            };
                            return res.redirect('/');
                        });
                } else {
                    req.session.message = {
                        message: "Las credenciales ingresadas no corresponden",
                        status: "danger",
                    };
                    return res.redirect('/');
                }
            })
            .catch((err) => {
                req.session.message = {
                    message: "Ocurrio un error al encontrar el correo",
                    status: "warning",
                };
                return res.redirect('/');
            });
    }
});

// Deslogueo mas limpiar la sesion 

router.get('/logout/:id', async (req, res) => {
    if (req.session.login) {
        res.redirect('/');
        delete req.session.login;
        req.session.destroy();

    } else {
        req.session.message = {
            message: "La sesion se encuentra cerrada",
            status: "warning",
        };
        return res.redirect('/');
    }
});

// Crear un nuevo registro de vacaciones

router.post("/records/:id", urlencodedParser, (req, res) => {
    User.findById(req.params.id)
        .then((data) => {
            if (data.tipoUser === "Client") {
                console.log(req.body)
                let record = new Record({
                    ced: req.body.ced,
                    name: data.name,
                    vaca: req.body.vaca,
                    dateStart: req.body.dateStar,
                    dateEnd: req.body.dateEnd,
                    detalle: req.body.detalle,
                    phone: req.body.phone,
                    department: req.body.dapartment
                });
                console.log(record)
                record
                    .save()
                    .then((result) => {
                        res.redirect(`/${data.id}/clientForm`);
                    })
                    .catch((err) => {
                        res.json({
                            status: "Failed",
                            message: "An error ocurred while saving user account!",
                        });
                    });
            } else {
                let record = new Record({
                    ced: req.body.ced,
                    name: data.name,
                    vaca: req.body.vaca,
                    dateStart: req.body.dateStart,
                    dateEnd: req.body.dateEnd,
                    detalle: req.body.detalle,
                    phone: req.body.phone,
                    department: req.body.department,
                    admin: req.params.id,
                });

                record
                    .save()
                    .then((result) => {
                        res.redirect(`/user/${record.admin}`);
                    })
                    .catch((err) => {
                        res.json({
                            status: "Failed",
                            message: "An error ocurred while saving user account!",
                        });
                    });
            }
        })
        .catch((err) => {
            console.log(err);
        });
});

// Editar el registro de las vacaciones

router.post("/edit/records/:id", urlencodedParser, (req, res) => {
    const login = req.session.login;

    console.log(req.session.login);


    let record = {
        ced: req.body.ced,
        name: req.body.name,
        vaca: req.body.vaca,
        dateStart: req.body.dateStar,
        dateEnd: req.body.dateEnd,
        detalle: req.body.detalle,
        phone: req.body.phone,
        department: req.body.dapartment,
        id: req.params.id,
        admin: login,
        estado: req.body.estado,
    };

    Record.findByIdAndUpdate(record.id, record)
        .then((result) => {
            result.estado = record.estado;
            result.admin = record.admin;
            User.find({ ced: record.ced }).then(data => {

                console.log(data);
                let mailOptions = {
                    from: emailApp,
                    to: `${data[0].email}`,
                    subject: 'Vacaciones solicitadas',
                    text: `Sus vacaciones fueron ${result.estado}s si tiene algun inconveniente por favor responder a este correo gracias`
                };

                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                        console.log(req.session.login);

                    }
                });
                res.redirect(`/user/${req.session.login}`);
            }).catch((err) => {
                console.log(err);
            });
        }).catch(err => { console.log(err) })
})

// Eliminar el registro de las vacaciones

router.get("/delete/records/:id", urlencodedParser, (req, res) => {

    let id = req.params.id;

    Record.findByIdAndDelete(id).then(result => {
        req.session.message = {
            message: "El registro se elimino con exito",
            status: "Danger",
        };
        res.redirect(`/user/${req.session.login}`);
    }).catch(err => {
        res.json({ message: err.message })
    })
})

// Ruta al formulario de edicion de registros

router.get("/edit/:id", async (req, res) => {
    let id = req.params.id;

    User.findOne(req.params.ced)
        .then((user) => {
            return (collab = user);
        })
        .catch((err) => {
            console.log(err);
        });

    Record.findById(id)
        .then((data) => {
            res.render("clientForm", { Came: data, collab: collab });
        })
        .catch((err) => {
            res.redirect(`/user/${req.session.login}`)
        })
})

// Ruta a la pagina de usuario dependiendo del tipo

router.get("/user/:id", async (req, res) => {

    let Users = await Record.find().sort({
        estado: "desc",
    });

    let pendiente = await Record.find({ estado: "Pendiente" }).count();
    let aceptado = await Record.find({ estado: "Aceptado" }).count();
    let declinado = await Record.find({ estado: "Declinado" }).count();
    let total = await Record.count();

    let Collab = await User.find();

    

    User.findById(req.session.login)
        .then(data => {
            if (data) {

                if (data.tipoUser !== "Client") {
                    res.render("about", { User: Users, collab: Collab, Came: data,Pen:pendiente,Ace:aceptado,Dec:declinado,Tot:total });
                } else {
                    res.redirect(`${data.id}/clientForm`)

                }
            }
        })
        .catch((e) => {
            req.session.message = {
                message: "La sesion se encuentra cerrada",
                status: "warning",
            };
            return res.redirect('/');
        });
});

// Reenderizado del formulario de registro nuevo

router.get("/:id/clientForm", (req, res) => {
    User.findById(req.session.login).then(data => {
        res.render('clientForm', { Came: data, collab: data })
    }).catch(err => {
        req.session.message = {
            message: "La sesion se encuentra cerrada",
            status: "warning",
        };
        return res.redirect('/');
    })

})

// Reenderizado de la tabla de registros del cliente

router.get("/:id/clientTable", (req, res) => {
    User.findById(req.session.login).then(data => {
        Record.find({ ced: data.ced }).then(records => {
            res.render('clientTable', { Came: data, collab: records })
        }).catch(err => {
            console.log(err)
        })
    }).catch(err => {
        req.session.message = {
            message: "La sesion se encuentra cerrada",
            status: "warning",
        };
        return res.redirect('/');
    })

})

module.exports = router;