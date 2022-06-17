"use strict";
// Imports
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var nodemailer = require("nodemailer");
var express_1 = __importDefault(require("express"));
var router = express_1.default.Router();
var bodyParser = require("express");
var multer = require("multer");
var app = (0, express_1.default)();
var session = require("express-session");
var urlencodedParser = bodyParser.urlencoded({ extended: false });
// mongoDB user model
var Token = require("../models/token");
var User = require("../models/user");
var Record = require("../models/newrecord");
// Password handler
var crypto = require("crypto");
var bcrypt = require("bcrypt");
// Guardar imagen de usuario en el servidor
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./uploads");
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    },
});
var upload = multer({
    storage: storage,
}).single("image");
// Cuenta del correo
var emailApp = process.env.outlook_email;
var appPass = process.env.outlook_pass;
var transporter = nodemailer.createTransport({
    service: "outlook365",
    host: 'smtp.office365.com',
    port: 587,
    auth: {
        user: emailApp,
        pass: appPass,
    }
});
// middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
router.use(session({
    secret: "Shh, its a secret!",
    saveUninitialized: true,
    resave: false,
}));
// Registro de usuario nuevo
router.post("/user/signup", upload, function (req, res) {
    var _a = req.body, name = _a.name, email = _a.email, password = _a.password, ced = _a.ced, phone = _a.phone;
    console.log(req.file);
    var img = req.file ? req.file.filename : "default.png";
    console.log(img);
    console.log(req.body);
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
    }
    else if (!/^[a-zA-Z ]*$/.test(name)) {
        res.json({
            status: "Failed",
            message: "Invalid name entered",
        });
    }
    else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        req.session.message = {
            message: "El correo ingresado no cumple con el formato",
            status: "danger",
        };
        res.redirect("/");
    }
    else if (!/^[0-9]+$/.test(ced)) {
        req.session.message = {
            message: "El campo cedula solo admite numeros",
            status: "danger",
        };
        res.redirect("/");
    }
    else if (!/^[0-9]+$/.test(phone)) {
        req.session.message = {
            message: "El campo telefono solo admite numeros",
            status: "danger",
        };
        res.redirect("/");
    }
    else if (password.length < 8) {
        req.session.message = {
            message: "La contraseña es muy corta son minimo 8 caracteres",
            status: "danger",
        };
        res.redirect("/");
    }
    else {
        User.find({ ced: ced })
            .then(function (result) {
            if (result.length) {
                // A user already exists
                req.session.message = {
                    message: "La cedula ingresada ya existe si ocupa ingresar por favor comunicarse con administrativo",
                    status: "warning",
                };
                res.redirect("/");
            }
            else {
                User.find({ email: email })
                    .then(function (result) {
                    if (result.length) {
                        // A user already exists
                        req.session.message = {
                            message: "El correo ingresado ya existe",
                            status: "warning",
                        };
                        res.redirect("/");
                    }
                    else {
                        // Try to create new user
                        // Password handling
                        var saltRoounds = 10;
                        bcrypt
                            .hash(password, saltRoounds)
                            .then(function (hashedPassword) {
                            var tipoUser = "Client";
                            var newUser = new User({
                                name: name,
                                email: email,
                                password: hashedPassword,
                                ced: ced,
                                phone: phone,
                                img: img,
                                tipoUser: tipoUser,
                            });
                            newUser
                                .save()
                                .then(function (result) {
                                // generate token and save
                                var token = new Token({ _userId: result._id, token: crypto.randomBytes(16).toString('hex') });
                                token.save(function (err) {
                                    if (err) {
                                        return res.status(500).send({ msg: err.message });
                                    }
                                    var mailOptions = { from: emailApp, to: email, subject: 'Account Verification Link', text: 'Hello ' + req.body.name + ',\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + result.email + '\/' + token.token + '\n\nThank You!\n' };
                                    console.log(mailOptions);
                                    transporter.sendMail(mailOptions, function (err) {
                                        if (err) {
                                            return res.status(404).send({ msg: 'Technical Issue!, Please click on resend for verify your Email.', err: err.message });
                                        }
                                        return res.render('verifing', { properties: 'A verification email has been sent to ' + result.email + '. It will be expire after one day. If you not get verification Email click on resend token.', email: result.email });
                                    });
                                });
                            })
                                .catch(function (err) {
                                res.send({
                                    status: "Failed",
                                    message: "An error ocurred while saving user account!",
                                });
                            });
                        })
                            .catch(function (err) {
                            res.json({
                                status: "Failed",
                                message: "An error ocurred while hashing password!",
                            });
                        });
                    }
                })
                    .catch(function (err) {
                    console.log(err);
                    res.json({
                        status: "Failed",
                        message: "An error occurred while checking existing email",
                    });
                });
            }
        })
            .catch(function (err) {
            console.log(err);
            res.json({
                status: "Failed",
                message: "An error occurred while checking existing ced",
            });
        });
    }
});
// Reenvio de link para confirmacion de correo
router.get('/resendlink/:email', function (req, res, next) {
    console.log(req.body.email + " " + req.params.email);
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
    });
});
router.get('/confirmation/:email/:token', function (req, res, next) {
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
router.post("/user/signin", urlencodedParser, function (req, res) {
    var ced = req.body.ced;
    var email = req.body.email;
    var password = req.body.password;
    if (email == "" || password == "" || ced == "") {
        req.session.message = {
            message: "Los campos se encuentran vacios",
            status: "danger",
        };
        return res.redirect('/');
    }
    else {
        // Check if user exist
        User.find({ email: email })
            .then(function (data) {
            if (data) {
                var userLogin_1 = data[0];
                //User exists
                var hashedPassword = userLogin_1.password;
                bcrypt
                    .compare(password, hashedPassword)
                    .then(function (result) {
                    if (result & (userLogin_1.ced === ced)) {
                        //Password match
                        if (userLogin_1.isVerified) {
                            req.session.login = data[0].id;
                            res.redirect("/user/".concat(req.session.login));
                        }
                        else {
                            req.session.message = {
                                message: "Su correo no fue verificado por favor verfiquelo antes de ingresar",
                                status: "info",
                            };
                            return res.redirect('/');
                        }
                    }
                    else {
                        req.session.message = {
                            message: "Su contraseña o cedula no coinciden",
                            status: "danger",
                        };
                        return res.redirect('/');
                    }
                })
                    .catch(function (err) {
                    req.session.message = {
                        message: "Ocurrio un error al comparar su contraseña",
                        status: "warning",
                    };
                    return res.redirect('/');
                });
            }
            else {
                req.session.message = {
                    message: "Las credenciales ingresadas no corresponden",
                    status: "danger",
                };
                return res.redirect('/');
            }
        })
            .catch(function (err) {
            req.session.message = {
                message: "Ocurrio un error al encontrar el correo",
                status: "warning",
            };
            return res.redirect('/');
        });
    }
});
// Deslogueo mas limpiar la sesion 
router.get('/logout/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        if (req.session.login) {
            res.redirect('/');
            delete req.session.login;
            req.session.destroy();
        }
        else {
            req.session.message = {
                message: "La sesion se encuentra cerrada",
                status: "warning",
            };
            return [2 /*return*/, res.redirect('/')];
        }
        return [2 /*return*/];
    });
}); });
// Crear un nuevo registro de vacaciones
router.post("/records/:id", urlencodedParser, function (req, res) {
    User.findById(req.params.id)
        .then(function (data) {
        if (data.tipoUser === "Client") {
            console.log(req.body);
            var record = new Record({
                ced: req.body.ced,
                name: data.name,
                vaca: req.body.vaca,
                dateStart: req.body.dateStar,
                dateEnd: req.body.dateEnd,
                detalle: req.body.detalle,
                phone: req.body.phone,
                department: req.body.dapartment
            });
            console.log(record);
            record
                .save()
                .then(function (result) {
                res.redirect("/".concat(data.id, "/clientForm"));
            })
                .catch(function (err) {
                res.json({
                    status: "Failed",
                    message: "An error ocurred while saving user account!",
                });
            });
        }
        else {
            var record_1 = new Record({
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
            record_1
                .save()
                .then(function (result) {
                res.redirect("/user/".concat(record_1.admin));
            })
                .catch(function (err) {
                res.json({
                    status: "Failed",
                    message: "An error ocurred while saving user account!",
                });
            });
        }
    })
        .catch(function (err) {
        console.log(err);
    });
});
// Editar el registro de las vacaciones
router.post("/edit/records/:id", urlencodedParser, function (req, res) {
    var login = req.session.login;
    console.log(req.session.login);
    var record = {
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
        .then(function (result) {
        result.estado = record.estado;
        result.admin = record.admin;
        User.find({ ced: record.ced }).then(function (data) {
            console.log(data);
            var mailOptions = {
                from: emailApp,
                to: "".concat(data[0].email),
                subject: 'Vacaciones solicitadas',
                text: "Sus vacaciones fueron ".concat(result.estado, "s si tiene algun inconveniente por favor responder a este correo gracias")
            };
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                }
                else {
                    console.log('Email sent: ' + info.response);
                    console.log(req.session.login);
                }
            });
            res.redirect("/user/".concat(req.session.login));
        }).catch(function (err) {
            console.log(err);
        });
    }).catch(function (err) { console.log(err); });
});
// Eliminar el registro de las vacaciones
router.get("/delete/records/:id", urlencodedParser, function (req, res) {
    var id = req.params.id;
    Record.findByIdAndDelete(id).then(function (result) {
        req.session.message = {
            message: "El registro se elimino con exito",
            status: "Danger",
        };
        res.redirect("/user/".concat(req.session.login));
    }).catch(function (err) {
        res.json({ message: err.message });
    });
});
// Ruta al formulario de edicion de registros
router.get("/edit/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id;
    return __generator(this, function (_a) {
        id = req.params.id;
        User.findOne(req.params.ced)
            .then(function (user) {
            return (collab = user);
        })
            .catch(function (err) {
            console.log(err);
        });
        Record.findById(id)
            .then(function (data) {
            res.render("clientForm", { Came: data, collab: collab });
        })
            .catch(function (err) {
            res.redirect("/user/".concat(req.session.login));
        });
        return [2 /*return*/];
    });
}); });
// Ruta a la pagina de usuario dependiendo del tipo
router.get("/user/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var Users, pendiente, aceptado, declinado, total, Collab;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Record.find().sort({
                    estado: "desc",
                })];
            case 1:
                Users = _a.sent();
                return [4 /*yield*/, Record.find({ estado: "Pendiente" }).count()];
            case 2:
                pendiente = _a.sent();
                return [4 /*yield*/, Record.find({ estado: "Aceptado" }).count()];
            case 3:
                aceptado = _a.sent();
                return [4 /*yield*/, Record.find({ estado: "Declinado" }).count()];
            case 4:
                declinado = _a.sent();
                return [4 /*yield*/, Record.count()];
            case 5:
                total = _a.sent();
                return [4 /*yield*/, User.find()];
            case 6:
                Collab = _a.sent();
                User.findById(req.session.login)
                    .then(function (data) {
                    if (data) {
                        if (data.tipoUser !== "Client") {
                            res.render("about", { User: Users, collab: Collab, Came: data, Pen: pendiente, Ace: aceptado, Dec: declinado, Tot: total });
                        }
                        else {
                            res.redirect("".concat(data.id, "/clientForm"));
                        }
                    }
                })
                    .catch(function (e) {
                    req.session.message = {
                        message: "La sesion se encuentra cerrada",
                        status: "warning",
                    };
                    return res.redirect('/');
                });
                return [2 /*return*/];
        }
    });
}); });
// Reenderizado del formulario de registro nuevo
router.get("/:id/clientForm", function (req, res) {
    User.findById(req.session.login).then(function (data) {
        res.render('clientForm', { Came: data, collab: data });
    }).catch(function (err) {
        req.session.message = {
            message: "La sesion se encuentra cerrada",
            status: "warning",
        };
        return res.redirect('/');
    });
});
// Reenderizado de la tabla de registros del cliente
router.get("/:id/clientTable", function (req, res) {
    User.findById(req.session.login).then(function (data) {
        Record.find({ ced: data.ced }).then(function (records) {
            res.render('clientTable', { Came: data, collab: records });
        }).catch(function (err) {
            console.log(err);
        });
    }).catch(function (err) {
        req.session.message = {
            message: "La sesion se encuentra cerrada",
            status: "warning",
        };
        return res.redirect('/');
    });
});
module.exports = router;
