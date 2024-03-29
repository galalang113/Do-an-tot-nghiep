const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const slug = require('mongoose-slug-generator');
const mongooseDelete = require('mongoose-delete');

const Order = new Schema({
    slugUser: { type: String, required: true },
    sumQuantity: { type: Number, required: true },
    sumPrice: { type: Number, required: true },
    userName: { type: String, required: true },
    userPhone: { type: Number, required: true },
    userAddress: { type: String, required: true },
    details: [{
        slug: { type: String, required: true },
        colorId: { type: String, required: true },
        colorName: { type: String, required: true },
        productName: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        sale: { type: Number, required: true, default: 0 },
    }],
    status: { type: Number, default: 2, required: true },
    slug: { type: String, required: true }
}, {
    timestamps: true,
});
// add plugin
mongoose.plugin(slug);
Order.plugin(mongooseDelete, {
    deletedAt: true,
    overrideMethods: true
});

module.exports = mongoose.model('Order', Order);