var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var RecordSchema = new Schema({
    ced: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    vaca: {
        type: String,
        required: true
    },
    estado: {
        type: String,
        required: true,
        default: "Pendiente"
    },
    department: {
        type: String,
        required: false
    },
    dateStart: {
        type: String,
        required: true
    },
    dateEnd: {
        type: String,
        required: true
    },
    created: {
        type: String,
        required: true,
        default: Date.now
    },
    phone: {
        type: String,
        required: true,
    },
    detalle: {
        type: String,
        required: false,
    },
    admin: {
        type: String,
        required: false,
    }
});
var Record = mongoose.model('Record', RecordSchema);
module.exports = Record;
