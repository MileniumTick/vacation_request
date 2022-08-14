// Imports

const nodemailer = require("nodemailer");
const express = require("express");
const router = express.Router();
const bodyParser = require("express");
const multer = require("multer");
const app = express();
const session = require("express-session");
const localStorage = require('localstorage')


let urlencodedParser = bodyParser.urlencoded({ extended: false });
var userId = ''

// mongoDB user model

const Token = require("../models/token")
const User = require("../models/user");
const Record = require("../models/newrecord");

// Password handler

const crypto = require("crypto");
const bcrypt = require("bcrypt");

// Guardar imagen de usuario en el servidor

let storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "./uploads");
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    },
});

let upload = multer({
    storage: storage,
}).single("image");

// Cuenta del correo

const emailApp = process.env.outlook_email;
const appPass = process.env.outlook_pass;


let transporter = nodemailer.createTransport({
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
    let img = req.file.filename

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
                                                // window.localStorage.setItem('userId', result._id)
                                                token.save(function(err) {
                                                    if (err) {
                                                        return res.status(500).send({ msg: err.message });
                                                    }

                                                    
                                                    
                                                    let mailOptions = { from: emailApp, to: result.email, subject: 'Account Verification Link', text: 'Hello ' + req.body.name + ',\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + result.email + '\/' + token.token + '\n\nThank You!\n' };
                                                    
                                                    transporter.sendMail(mailOptions, function(err) {
                                                        if (err) {
                                                            return res.render('verifing', { properties: 'Technical Issue!, Please click on resend for verify your Email sent to ' + result.email + '. It will be expire after one day. If you not get verification Email click on resend token.', email: result.email });
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
                            
                            res.json({
                                status: "Failed",
                                message: "An error occurred while checking existing email",
                            });
                        });
                }
            })
            .catch((err) => {
                
                res.json({
                    status: "Failed",
                    message: "An error occurred while checking existing ced",
                });
            });
    }
});

// Reenvio de link para confirmacion de correo

router.get('/resendlink/:email', (req, res, next) => {

    

    User.findOne({ email: req.params.email }, function(err, user) {
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
            token.save(function(err) {
                if (err) {
                    return res.status(500).send({ msg: err.message });
                }

                // Send email (use verified sender's email address & generated API_KEY on SendGrid)
                var mailOptions = { from: emailApp, to: user.email, subject: 'Account Verification Link', text: 'Hello ' + user.name + ',\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + user.email + '\/' + token.token + '\n\nThank You!\n' };
                transporter.sendMail(mailOptions, function(err) {
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
    Token.findOne({ token: req.params.token }, function(err, token) {
        // token is not found into database i.e. token may have expired 
        
        if (!token) {
            req.session.message = {
                message: "Su link para accesar ya expiro",
                status: "error",
            };
            return res.redirect('/');
        }
        // if token is found then check valid user 
        else {
            User.findOne({ _id: token._userId, email: req.params.email }, function(err, user) {
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
                    user.save(function(err) {
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
                    //User exists
                    const hashedPassword = data[0].password;
                    bcrypt
                        .compare(password, hashedPassword)
                        .then((result) => {
                            if (result & (data[0].ced === ced)) {
                                //Password match
                                if (data[0].isVerified) {
                                    if(userId == '') {
                                        userId = data[0].id;
                                        
                                    }
                                    req.session.login = data[0].id;
                                    res.redirect(`/user/${userId}/`);
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

router.get('/logout/:id', async(req, res) => {
    if (userId) {
        res.redirect('/');
        userId = '';

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
    const login = userId;


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

                
                let mailOptions = {
                    from: 'chavarriajosue11@gmail.com',
                    to: `${data[0].email}`,
                    subject: 'Vacaciones solicitadas',
                    text: `Sus vacaciones estan ${result.estado}s si tiene algun inconveniente por favor responder a este correo gracias`
                };

                transporter.sendMail(mailOptions, function(error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                        res.redirect(`/user/${userId}`);
                    }
                });
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
            status: "Danger",
            message: "El registro se elimino con exito"
        };
        res.redirect(`/user/${userId}`);
    }).catch(err => {
        res.json({ message: err.message })
    })
})

// Ruta al formulario de edicion de registros

router.get("/edit/:id", async(req, res) => {
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
            res.redirect(`/user/${userId}`)
        })
})

// Ruta a la pagina de usuario dependiendo del tipo

router.get("/user/:id", async(req, res) => {

    let Users = await Record.find().sort({
        estado: "desc",
    });

    let Collab = await User.find();


    User.findById(userId)
        .then(data => {
            if (data) {

                if (data.tipoUser !== "Client") {
                    res.render("about", { User: Users, collab: Collab, Came: data });
                } else {
                    res.redirect(`/user/clientForm/${data.id}`)

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

router.get("/user/clientForm/:id", (req, res) => {
    User.findById(userId).then(data => {
        res.render('clientForm', { Came: data, collab: data })
    }).catch(err => {
        req.session.message = {
            message: err,
            status: "warning",
        };
        return res.redirect('/');
    })

})

// Reenderizado de la tabla de registros del cliente

router.get("/user/clientTable/:id", (req, res) => {
    User.findById(userId).then(data => {
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

router.get("/user/edit/:id", (req, res) => {
    User.findById(userId).then(result =>
        res.render('userForm', { Came: result })).catch(err => console.log(err)).catch(err => res.redirect('/'))
})

router.post("/user/edit/profile/:id", urlencodedParser, (req, res) => {

    let user = {
        password: req.body.newPass,
        name: req.body.name,
        phone: req.body.phone
    }

    let {password, name, phone} = user

    if(password == '' || name == '' || phone == ''){
        req.session.message = {
            message: "Se encuentran campos vacios",
            status: "warning",
        };
        return res.redirect(`/edit/${userId}`);
    }

    User.findById(userId).then(result => {
        if (result) {
            const hashedPassword = result.password;

            bcrypt
                .compare(req.body.oldPass, hashedPassword)
                .then(data => {
                    const saltRoounds = 10;
                    bcrypt
                        .hash(user.password, saltRoounds)
                        .then((newhashedPassword) => {

                            result.password = newhashedPassword
                            result.name = user.name
                            result.phone = user.phone

                            result.save().then(data => {
                                req.session.message = {
                                    message: "Los cambios fueron realizados",
                                    status: "success",
                                };
                                return res.redirect(`/edit/${userId}`);
                            });

                        }).catch(err => {
                            req.session.message = {
                                message: "Tuvo un error a la hora de guardar el usuario",
                                status: "Danger",
                            };
                            return res.redirect(`/edit/${userId}`);
                        })
                }).catch(err => {
                    req.session.message = {
                        message: "La contrasenna antigua es erronea",
                        status: "warning",
                    };
                    return res.redirect(`/edit/user/${userId}`);
                })
        }
    }).catch(err => {
        console.log(err)
    })
})

module.exports = router;