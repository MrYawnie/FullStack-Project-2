import express from "express";
import axios from "axios";
import cheerio from "cheerio";
import cors from "cors";
import * as dotenv from "dotenv";
import PriceSchema from "../mongodb/models/price.js";

dotenv.config();

const app = express();
const router = express.Router();
app.use(cors());
app.use(express.json()); // To parse JSON bodies
app.use(router); // Use the router with your app

const ntfyMessage = (product) => {
  fetch('https://ntfy.sh/pricetracker-price-change', {
    method: 'POST',
    headers: {
      'Title': 'Price change for ' + product.name,
      'Priority': '3',
    },
    body: 'Price for ' + product.name + ' has changed from ' + product.prevPrice + '€ to ' + product.price + '€.\n\n' + product.url,
  });
};

async function getLastentarvikeProducts(query) {
  const url = `https://www.lastentarvike.fi/verkkokauppa/api/search?query=${query}`;
  const response = await axios.get(url);
  const data = response.data;

  // const products = data.filter((product) => product.relevance > 0.9 || product.type === "package");
  const products = data;

  for (const product of products) {
    // Check if the product already exists in the database
    let existingProduct;

    if (product.type === "package") {
      existingProduct = await PriceSchema.findOne({ material: product.material });
    } else {
      existingProduct = await PriceSchema.findOne({ id: product.id });
    }

    // const existingProduct = await PriceSchema.findOne({ id: product.id });

    if (!existingProduct) {
      // If the product doesn't exist, create and save the new product
      const priceToUse = product.specialPrice !== undefined ? product.specialPrice : product.price;

      const newProduct = new PriceSchema({
        store: "lastentarvike",
        id: product.id,
        name: product.name,
        material: product.material, // Assuming `material` is the correct field for `productNumber`
        price: priceToUse,
        historicalLow: priceToUse,
        historicalLowDate: Date.now(),
        priceHistory: [{ price: priceToUse }],
        imageUrl: product.imageUrl,
        url: product.url,
        soldCount: product.soldCnt,
      });

      await newProduct.save();
    } else {
      const priceToUse = product.specialPrice !== undefined ? product.specialPrice : product.price;

      if (existingProduct.price !== priceToUse) {
        existingProduct.prevPrice = existingProduct.price;
        existingProduct.price = priceToUse;
        existingProduct.priceHistory.push({ price: priceToUse });
        existingProduct.updated = Date.now();

        if (priceToUse < existingProduct.historicalLow) {
          existingProduct.historicalLow = priceToUse;
          existingProduct.historicalLowDate = Date.now();
        }

        await existingProduct.save();
        ntfyMessage(existingProduct);
      }

      if (existingProduct.soldCount !== product.soldCnt) {
        existingProduct.soldCount = product.soldCnt;
        existingProduct.updated = Date.now();
        await existingProduct.save();
      }
    }
  }
  // Return processed products
  return products.map((product) => ({
    store: "lastentarvike",
    id: product.id,
    name: product.name,
    material: product.material,
    price: product.price,
    specialPrice: product.specialPrice,
    imageUrl: product.imageUrl,
    url: product.url,
    soldCount: product.soldCnt,
    updated: Date.now(),
  }));
}

async function getCrocoliiniProducts(query) {
  const url = `https://www.crocoliini.fi/search/?q=${query}`;
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  const results = $("div.ListItem")
    .map((_, el) => {
      const $el = $(el);
      const url = "https://www.crocoliini.fi" + $el.find("a.ProductImage").attr("href");
      const name = $el.find("h3.ProductName a").text().trim();
      const id = Number(url.match(/\/searchproduct\/(\d+)/)[1]); // Updated regular expression pattern
      const imageUrl = "https://www.crocoliini.fi" + $el.find("div.ProductImageContainer img").attr("src");

      let priceText = $el
        .find("span.ProductDiscountPrice")
        .text()
        .trim()
        .replace(/[^0-9.,]/g, "");

      if (!priceText) {
        priceText = $el
          .find("span.ProductCurrentPrice")
          .text()
          .trim()
          .replace(/[^0-9.,]/g, "");
      }

      // Convert priceText to a number and handle comma as decimal separator
      const price = parseFloat(priceText.replace(',', '.'));

      return { id, name, price, url, imageUrl };
    })
    .get();

  for (const product of results) {
    const existingProduct = await PriceSchema.findOne({ id: product.id });

    if (!existingProduct) {
      const newProduct = new PriceSchema({
        store: "crocoliini",
        id: product.id,
        name: product.name,
        price: product.price,
        historicalLow: product.price,
        historicalLowDate: Date.now(),
        priceHistory: [{ price: product.price }],
        imageUrl: product.imageUrl,
        url: product.url,
      });

      await newProduct.save();
    } else {
      if (existingProduct.price !== product.price) {
        existingProduct.prevPrice = existingProduct.price;
        existingProduct.price = product.price;
        existingProduct.priceHistory.push({ price: product.price });
        existingProduct.updated = Date.now();

        if (product.price < existingProduct.historicalLow) {
          existingProduct.historicalLow = product.price;
          existingProduct.historicalLowDate = Date.now();
        }

        await existingProduct.save();
        ntfyMessage(existingProduct);
      }
    }
  }
  return results.map((product) => ({
    store: "crocoliini",
    id: product.id,
    name: product.name,
    price: product.price,
    imageUrl: product.imageUrl,
    url: product.url,
    updated: Date.now(),
  }));
}

async function getLastenturvaProducts(query) {
  try {
    let data = `{
      "searches": [
        {
          "exhaustive_search": true,
          "highlight_full_fields": "_id,categories,brand,description,name,variantIds",
          "infix": "off,off,off,off,off,off",
          "num_typos": "0,2,2,0,2,0",
          "prefix": "true,true,true,true,true,true",
          "prioritize_exact_match": true,
          "q": "${query}",
          "query_by": "_id,categories,brand,description,name,variantIds",
          "query_by_weights": "1,100,100,85,100,100",
          "sort_by": "_text_match:desc,frosmo_combined_boost:desc,frosmo_most_viewed:desc",
          "collection": "lastenturva_fi",
          "facet_by": "brand,price,hierarchicalCategories.lvl0",
          "max_facet_values": 20,
          "page": 1,
          "per_page": 250
        }
      ]
    }`;

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://inpref.com/search/multi_search?x-typesense-api-key=lastenturva_fi',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-FI,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
        'content-type': 'application/json;charset=UTF-8',
        'dnt': '1',
        'origin': 'https://www.lastenturva.fi',
        'priority': 'u=1, i',
        'referer': `https://www.lastenturva.fi/i/haku/72/?query=${query}`,
        'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site'
      },
      data: data
    };

    const response = await axios.request(config);
    const responseData = response.data.results[0].hits;
    console.log('Response: ' + response);
    console.log('Response data: ' + responseData);

    for (const product of responseData) {
      // Check if the product already exists in the database
      const existingProduct = await PriceSchema.findOne({ id: product.document.id });

      if (!existingProduct) {
        // If the product doesn't exist, create and save the new product
        // const priceToUse = product.specialPrice !== undefined ? product.specialPrice : product.price;

        const newProduct = new PriceSchema({
          store: "lastenturva",
          id: product.document.id,
          name: product.document.name,
          price: product.document.price,
          historicalLow: product.document.price,
          historicalLowDate: Date.now(),
          priceHistory: [{ price: product.document.price }],
          imageUrl: product.document.image,
          url: product.document.url,
        });

        await newProduct.save();
      } else {
        const priceToUse = product.document.price;

        if (existingProduct.price !== priceToUse) {
          existingProduct.prevPrice = existingProduct.price;
          existingProduct.price = priceToUse;
          existingProduct.priceHistory.push({ price: priceToUse });
          existingProduct.updated = Date.now();

          if (priceToUse < existingProduct.historicalLow) {
            existingProduct.historicalLow = priceToUse;
            existingProduct.historicalLowDate = Date.now();
          }

          await existingProduct.save();
          ntfyMessage(existingProduct);
        }
      }
    }
    // Return processed products
    return responseData.map((product) => ({
      store: "lastenturva",
      id: product.document.id,
      name: product.document.name,
      price: product.document.price,
      imageUrl: product.document.image,
      url: product.document.url,
      updated: Date.now(),
    }));
  } catch (error) {
    console.log(error);
    // Return an empty array or handle the error as per your requirement
    return [];
  }
}

async function getProducts(query, stores) {
  let products = [];

  if (stores.length === 0) {
    products.push(...await getLastentarvikeProducts(query));
    products.push(...await getCrocoliiniProducts(query));
    products.push(...await getLastenturvaProducts(query));
  } else {
    for (const store of stores) {
      if (store === "lastentarvike") {
        products.push(...await getLastentarvikeProducts(query));
      } else if (store === "crocoliini") {
        products.push(...await getCrocoliiniProducts(query));
      } else if (store === "lastenturva") {
        products.push(...await getLastenturvaProducts(query));
      }
    }
  }
  return products;
}

// Create a GET endpoint to search products
router.get("/search", async (req, res) => {
  const query = req.query.q || "Emmaljunga+Sento";
  let stores = req.query.store || [];
  // const store = req.query.store || undefined;
  if (!Array.isArray(stores)) {
    stores = stores.split(",");
  }

  const products = await getProducts(query, stores);
  if (products.length > 0) {
    res.json(products);
  } else {
    res.status(404).send("Results not found");
  }
});

/* router.get("/products", async (req, res) => {
  let query;
  if (req.query.store) {
    query = PriceSchema.find({ 
      name: { $regex: '.*' + req.query.q + '.*', $options: 'i' }, 
      store: { $regex: '.*' + req.query.store + '.*', $options: 'i' }
    });
  } else {
    query = PriceSchema.find({ 
      name: { $regex: '.*' + req.query.q + '.*', $options: 'i' }
    });
  }
  const products = await query.exec();
  res.json(products);
}); */

router.get("/products", async (req, res) => {
  let queryConditions = {};

  // Handle numeric range filters separately
  if (req.query.minPrice) {
    // Assuming price is a numeric field
    const minPrice = Number(req.query.minPrice);
    if (!isNaN(minPrice)) { // Make sure it's a valid number
      queryConditions.price = { ...queryConditions.price, $gte: minPrice };
    } else {
      // Handle any potential errors
      res.status(400).json({ message: "minPrice must be a valid number" });
      return;
    }
  }

  if (req.query.maxPrice) {
    const maxPrice = Number(req.query.maxPrice);
    if (!isNaN(maxPrice)) { // Make sure it's a valid number
      queryConditions.price = { ...queryConditions.price, $lte: maxPrice };
    } else {
      // Handle any potential errors
      res.status(400).json({ message: "maxPrice must be a valid number" });
      return;
    }
  }

  if (req.query.id) {
    const id = Number(req.query.id);
    if (!isNaN(id)) {
      queryConditions.id = id;
    } else {
      res.status(400).json({ message: "id must be a valid number" });
      return;
    }
  }

  if (req.query._id) {
    queryConditions._id = req.query._id;
  }

  if (req.query.q) {
    queryConditions.name = { $regex: '.*' + req.query.q + '.*', $options: 'i' };
  }

  // Process other query params for text search
  Object.keys(req.query).forEach(key => {
    // We'll skip any numeric filters since they're handled separately
    if (!['minPrice', 'maxPrice', '_id', 'id', 'q'].includes(key)) {
      // Continue using regex search for text fields
      queryConditions[key] = { $regex: '.*' + req.query[key] + '.*', $options: 'i' };
    }
  });

  try {
    const products = await PriceSchema.find(queryConditions).exec();
    res.json(products);
  } catch (error) {
    // Handle any potential errors
    res.status(500).json({ message: "An error occurred during the query", error: error.toString() });
  }
});

router.get("/products/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const product = await PriceSchema.findOne({
      _id: id,
    });
    if (product) {
      res.json(product);
    } else {
      res.status(404).send("Product not found");
    }
  } catch (error) {
    res.status(500).json({ message: "An error occurred during the query", error: error.toString() });
  }
});

router.post("/products/add", async (req, res) => {
  const product = req.body;
  try {
    const newProduct = new PriceSchema(product);
    await newProduct.save();
    res.json(newProduct);
  } catch (error) {
    res.status(500).json({ message: "An error occurred while saving the product", error: error.toString() });
  }
});

router.delete("/products/delete/:id", async (req, res) => {
  const id = req.params.id;
  const product = await PriceSchema.findOneAndDelete({ _id: id });
  if (!product) {
    res.status(404).send("Product not found");
  }
  res.json(product + " deleted");
});

export default router; // For importing this router elsewhere
