const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Raiting = require('../models/Raiting');
const { multipleMongooseToObject, singleMongooseToObject, multipleMongooseToObjectOnLimit } = require('../../util/mongoose');
class ApiHomeController {
    // [GET] /search/:search
    showSearch(req, res, next) {
        Product.find({ name: { $regex: new RegExp(req.params.search, "i") } }).limit(5).skip(0)
            .then(products => {
                return res.send({
                    products: multipleMongooseToObject(products)
                })
            })
            .catch(next)
    };
    // [POST] /raiting
    raiting(req, res, next) {
        try {
            const token = req.header('Authorization').replace("Bearer ", "");
            const decoded = jwt.verify(token, process.env.EPHONE_STORE_PRIMARY_KEY);
            if (!decoded) throw new Error('TOKEN UNDEFINED!');
            User.findOne({ slug: decoded._id, token: token })
                .then(user => {
                    let files = [];
                    req.files.forEach(function(value) {
                        files.push(value.filename);
                    });
                    let body = JSON.parse(JSON.stringify(req.body));
                    let objRaiting = {
                        star: body.star,
                        proSlug: body.proSlug,
                        userSlug: body.userSlug,
                        content: body.content,
                        images: files,
                    };

                    let raiting = new Raiting(objRaiting);
                    raiting.save();
                    return res.send({
                        raiting: true,
                        message: 'Đánh giá sản phẩm thành công!',
                        name: user.fullname,
                        star: raiting.star,
                        content: body.content,
                        images: files,
                    });
                })
                .catch(next)
        } catch (err) {
            return res.send({
                raiting: false,
                message: 'Đánh giá sản phẩm thất bại!'
            });
        }
    };
    // [GET] /searchName
    searchName(req, res, next) {
        let maxProduct = 12;
        let skipPage = ((req.query.page ? req.query.page : 1) - 1) * maxProduct;
        Product.find({ name: { $regex: new RegExp(req.query.q, "i") } }).sort({
                price: -1
            })
            .then(products => {
                return res.send({
                    page: req.query.page,
                    productViewed: skipPage + multipleMongooseToObjectOnLimit(products, maxProduct, skipPage).length,
                    totalProduct: products.length,
                    products: multipleMongooseToObjectOnLimit(products, maxProduct, skipPage)
                })
            })
            .catch(next)
    };
    // [GET] /mutipleSearch
    mutipleSearch(req, res, next) {
        let maxProduct = 12;
        let priceVND = 1000000;
        let pageNumber = Number.parseInt(req.query.page) - 1;
        let skipPage = pageNumber * maxProduct;
        let searchSlug = JSON.parse(req.query.mf);
        let price = JSON.parse(req.query.price);
        let condition = {};
        if (searchSlug.length > 0 && Object.keys(price).length > 0) {
            condition.name = { $regex: new RegExp(req.query.name, "i") };
            condition.categori = { $in: searchSlug };
            condition.price = { $gte: price.min * priceVND, $lt: price.max * priceVND };
        } else if (searchSlug.length == 0 && Object.keys(price).length > 0) {
            condition.name = { $regex: new RegExp(req.query.name, "i") };
            condition.price = { $gte: price.min * priceVND, $lt: price.max * priceVND };
        } else if (searchSlug.length > 0 && Object.keys(price).length == 0) {
            condition.name = { $regex: new RegExp(req.query.name, "i") };
            condition.categori = { $in: searchSlug };
        } else {
            condition.name = { $regex: new RegExp(req.query.name, "i") };
        }
        Product.find(condition)
            .sort({
                price: -1
            })
            .then(products => {
                return res.send({
                    page: pageNumber + 2,
                    productViewed: skipPage + multipleMongooseToObjectOnLimit(products, maxProduct, skipPage).length,
                    totalProduct: products.length,
                    products: multipleMongooseToObjectOnLimit(products, maxProduct, skipPage)
                })
            })
            .catch(next)
    };
    // [GET] /menu
    menu(req, res, next) {
        Category.find({})
            .then(categories => {
                return res.status(200).json({ categories: categories });
            })
            .catch(next);
    };
}
module.exports = new ApiHomeController;