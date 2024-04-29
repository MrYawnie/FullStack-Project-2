// post.js
import mongoose from "mongoose";

const PriceSchema = new mongoose.Schema({
    store: { type: String, required: true },
    id: { type: Number, required: true },
    name: { type: String, required: true },
    material: { type: String, required: false },
    packageId: { type: String, required: false },
    price: { type: Number, required: true },
    historicalLow: { type: Number, required: true },
    historicalLowDate: { type: Date, required: false },
    prevPrice: { type: Number, required: false },
    priceHistory: [{ 
        price: { type: Number, required: true },
        date: { type: Date, default: Date.now },
    }],
    imageUrl: { type: String, required: false },
    url: { type: String, required: true },
    datetime: { type: Date, default: Date.now },
    updated: { type: Date, required: false },
    soldCount: { type: Number, required: false },
});

const PricePost = mongoose.model('Price', PriceSchema);
/* const PricePost = global.mainDB.connection.model('Price', PriceSchema); */

export default PricePost;
