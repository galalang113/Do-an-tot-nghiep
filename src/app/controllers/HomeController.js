const Product = require('../models/Product');
const User = require('../models/User');
const Raiting = require('../models/Raiting');
const { multipleMongooseToObject, singleMongooseToObject, multipleMongooseToObjectOnLimit } = require('../../util/mongoose');
const { randomToBetween } = require('../../helper/random');
class HomeController {
    // [GET] /
    index(req, res, next) {
        var count = 0;
        Product.find({})
            .then(products => {
                count = products.length;
            });
        Promise.all([
                Product.find({}).limit(15).skip(randomToBetween(0, ((count > 20) ? (count - 10) : 1))),
                Product.find({
                    hot: true
                }).limit(12).skip(0)
            ])
            .then(([products, productsHot]) => {
                res.render('home/index', {
                    products: multipleMongooseToObject(products),
                    productsHot: multipleMongooseToObject(productsHot),
                });
            })
            .catch(next)
    }

    // [GET] /:categori/:slug
    show(req, res, next) {
        Promise.all([
                Product.findOne({
                    slug: req.params.slug,
                    categori: req.params.categori
                }),
                Product.find({
                    categori: req.params.categori
                }).limit(12).skip(0),
                Raiting.aggregate([{
                        $lookup: {
                            from: 'users',
                            localField: 'userSlug',
                            foreignField: 'slug',
                            as: 'userdetails'
                        }
                    },
                    { $match: { proSlug: req.params.slug } }
                ])
            ])
            .then(([phone, phones, raitings]) => {
                if (phone) {
                    res.render('home/detail', {
                        phone: singleMongooseToObject(phone),
                        productsHot: multipleMongooseToObject(phones),
                        raitings: raitings,
                    });
                } else {
                    res.redirect('/');
                }
            })
            .catch(next)
    }

    // [GET] /cart
    showCart(req, res, next) {
        res.render('home/cart');
    }

    // [GET] /payment
    showPayment(req, res, next) {
        res.render('home/payment');
    }

    // [GET] /payment/success
    showPaymentSuccess(req, res, next) {
        res.render('home/paymentsuccess');
    }

    // [GET] /search
    showSearch(req, res, next) {
        if (['all'].includes(req.params.search)) {
            Product.find({ name: { $regex: new RegExp((req.query.q ? req.query.q : ''), "i") } })
                .then(products => {
                    return res.render('home/search', {
                        totalPage: Math.ceil(products.length / 12),
                        products: multipleMongooseToObjectOnLimit(products, 12)
                    });
                })
                .catch(next)
        } else {
            Product.find({ categori: req.params.search })
                .then(products => {
                    return res.render('home/search', {
                        totalPage: Math.ceil(products.length / 12),
                        products: multipleMongooseToObjectOnLimit(products, 12)
                    });
                })
                .catch(next)

        }
    }

    // // [GET] /profile/:slug
    // showProfile(req, res, next) {

    //     User.findOne({
    //             slug: req.params.slug
    //         })
    //         .then(account => {
    //             res.render('home/profile', {
    //                 account: singleMongooseToObject(account),
    //             });
    //         })
    //         .catch(next)
    // }

    show404(req, res, next) {
        res.render('home/notfound', { layout: false });
    }
}
module.exports = new HomeController;