const Order = require('../../models/Order');
const Product = require('../../models/Product');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const { multipleMongooseToObject, singleMongooseToObject, multipleMongooseToObjectOnLimit } = require('../../../util/mongoose');

class AdminOrderController {
    // [GET] /admin/oder/:status/search
    search(req, res, next) {
        try {
            const token = req.header('Authorization').replace("Bearer ", "");
            const decoded = jwt.verify(token, process.env.EPHONE_STORE_PRIMARY_KEY);
            if (!decoded) throw new Error('TOKEN UNDEFINED!');
            let page = parseInt(req.query.page) || 1;

            let skip = (page - 1) * process.env.LIMIT_DOS;

            let searchID = (req.query.q) ? { status: req.params.status, _id: req.query.q } : { status: req.params.status };
            Promise.all([
                    Order.find(searchID).sort({ createdAt: -1 }),
                    Order.countDocuments({ status: 1 }).sort({ createdAt: -1 }),
                    Order.countDocuments({ status: 2 }).sort({ createdAt: -1 }),
                    Order.countDocuments({ status: 3 }).sort({ createdAt: -1 }),
                    Order.countDocuments({ status: 0 }).sort({ createdAt: -1 })
                ])
                .then(([orderNew, countOrderFinished, countOrderWarning, countOrderSuccess, countOrderFailed]) => {

                    let pageMax = Math.ceil((orderNew.length / process.env.LIMIT_DOS));
                    let pagePre = ((page > 0) ? page - 1 : 0);
                    let pageNext = ((page < pageMax) ? page + 1 : page);
                    return res.send({
                        orderNewList: multipleMongooseToObjectOnLimit(orderNew, process.env.LIMIT_DOS, skip),
                        STT: (((page - 1) * process.env.LIMIT_DOS) + 1),
                        countOrderFinished,
                        countOrderWarning,
                        countOrderSuccess,
                        countOrderFailed,
                        pagePre,
                        pageActive: page,
                        pageNext,
                        statusOrder: req.params.status,
                        limit: process.env.LIMIT_DOS
                    })
                })
                .catch((err) => {
                    throw new Error('Error connecting DB!');
                })
        } catch (e) {
            return res.send({
                message: e
            })
        }
    };
    // [GET] /admin/oder/:id/edit
    edit(req, res, next) {
        try {
            const token = req.header('Authorization').replace("Bearer ", "");
            const decoded = jwt.verify(token, process.env.EPHONE_STORE_PRIMARY_KEY);
            if (!decoded) throw new Error('TOKEN UNDEFINED!');
            Order.findOne({ _id: req.params.id })
                .then((order) => {
                    return Promise.all([
                        order,
                        User.findOne({ slug: order.slugUser })
                    ])
                })
                .then(([order, user]) => {
                    return res.send({
                        ...order._doc,
                        email: user.email,
                    });
                })
                .catch((err) => {
                    throw new Error(err.message);
                })
        } catch (e) {
            return res.send({
                message: e
            })
        }
    };
    // [PUT] /admin/oder/:id/update
    update(req, res, next) {
        try {
            const token = req.header('Authorization').replace("Bearer ", "");
            const decoded = jwt.verify(token, process.env.EPHONE_STORE_PRIMARY_KEY);
            if (!decoded) throw new Error('TOKEN UNDEFINED!');

            const result = async() => {
                const order = await Order.findOne({ _id: req.params.id });
                // Thay đổi trạng thái đơn hàng
                order.status = req.body.status;
                if (req.body.status == 1) {
                    var updateProduct;
                    // Duyệt qua từng sản phẩm của đơn hàng
                    for (let i = 0; i < order.details.length; i++) {
                        const product = await Product.findOne({ slug: order.details[i].slug });
                        // Duyệt qua màu của từng sản phẩm 
                        for (let j = 0; j < product.colors.length; j++) {
                            if (order.details[i].colorId == product.colors[j]._id) {
                                product.colors[j].quantity = Number.parseInt(product.colors[j].quantity) - Number.parseInt(order.details[i].quantity);
                            }
                        }
                        updateProduct = await Product.updateOne({ slug: order.details[i].slug }, product);
                    }
                }
                // Cập nhật trạng thái đơn hàng
                const updateOrder = await Order.updateOne({ _id: req.params.id }, order);
                return Promise.all([order, updateOrder, updateProduct]);
            }
            result()
                .then(([order, updateOrder, updateProduct]) => {
                    return res.send({
                        message: 'Cập nhật đơn hàng thành công!'
                    });
                })
                .catch((err) => {
                    throw new Error(err.message);
                });
        } catch (e) {
            return res.send({
                message: e
            })
        }
    };
}
module.exports = new AdminOrderController;