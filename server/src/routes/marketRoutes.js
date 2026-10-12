import express from 'express';
import {
  getMarketAssets,
  getAssetDetail,
  advanceMarketCycle,
  buyAsset,
  sellAsset,
  getPortfolio
} from '../services/marketService.js';

const router = express.Router();

/**
 * GET /api/marketplace/assets
 * Lists all fictional marketplace assets, deterministic prices, and historical points.
 */
router.get('/marketplace/assets', (req, res, next) => {
  try {
    const data = getMarketAssets();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/marketplace/assets/:id
 * Returns single asset details and full price history.
 */
router.get('/marketplace/assets/:id', (req, res, next) => {
  try {
    const asset = getAssetDetail(req.params.id);
    res.json(asset);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

/**
 * POST /api/marketplace/advance
 * Advances simulation market cycle deterministically.
 */
router.post('/marketplace/advance', (req, res, next) => {
  try {
    const result = advanceMarketCycle();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/marketplace/buy
 * Buys units of an asset using available liquid cash.
 */
router.post('/marketplace/buy', (req, res, next) => {
  try {
    const { asset_id, quantity } = req.body || {};
    if (asset_id === undefined || asset_id === null || String(asset_id).trim() === '') {
      return res.status(400).json({ error: 'Missing required field: asset_id' });
    }
    if (quantity === undefined || quantity === null || String(quantity).trim() === '') {
      return res.status(400).json({ error: 'Missing required field: quantity' });
    }

    const parsedAssetId = parseInt(asset_id, 10);
    const parsedQuantity = parseInt(quantity, 10);

    const result = buyAsset(undefined, { asset_id: parsedAssetId, quantity: parsedQuantity });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/marketplace/sell
 * Sells units of an asset and credits proceeds to available cash.
 */
router.post('/marketplace/sell', (req, res, next) => {
  try {
    const { asset_id, quantity } = req.body || {};
    if (asset_id === undefined || asset_id === null || String(asset_id).trim() === '') {
      return res.status(400).json({ error: 'Missing required field: asset_id' });
    }
    if (quantity === undefined || quantity === null || String(quantity).trim() === '') {
      return res.status(400).json({ error: 'Missing required field: quantity' });
    }

    const parsedAssetId = parseInt(asset_id, 10);
    const parsedQuantity = parseInt(quantity, 10);

    const result = sellAsset(undefined, { asset_id: parsedAssetId, quantity: parsedQuantity });
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/portfolio
 * Returns portfolio valuation, individual holdings, asset allocation, and trade history.
 */
router.get('/portfolio', (req, res, next) => {
  try {
    const portfolio = getPortfolio();
    res.json(portfolio);
  } catch (error) {
    next(error);
  }
});

export default router;
