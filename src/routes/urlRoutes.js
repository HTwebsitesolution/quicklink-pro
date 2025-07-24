const express = require('express');
const { body } = require('express-validator');
const urlController = require('../controllers/urlController');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

// Validation rules
const shortenValidation = [
  body('originalUrl')
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Please provide a valid URL with http or https protocol')
    .isLength({ max: 2048 })
    .withMessage('URL must be less than 2048 characters'),
  body('customAlias')
    .optional()
    .isLength({ min: 3, max: 15 })
    .withMessage('Custom alias must be between 3 and 15 characters')
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('Custom alias can only contain letters, numbers, hyphens, and underscores'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters'),
  body('expiration')
    .optional()
    .isISO8601()
    .withMessage('Expiration must be a valid date'),
];

const bulkShortenValidation = [
  body('urls')
    .isArray({ min: 1, max: 100 })
    .withMessage('URLs array must contain between 1 and 100 URLs'),
  body('urls.*')
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Each URL must be valid with http or https protocol'),
  body('prefix')
    .optional()
    .isLength({ min: 2, max: 10 })
    .withMessage('Prefix must be between 2 and 10 characters')
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('Prefix can only contain letters, numbers, hyphens, and underscores'),
];

// Routes
router.post('/shorten', shortenValidation, validateRequest, urlController.shortenUrl);
router.post('/bulk-shorten', bulkShortenValidation, validateRequest, urlController.bulkShortenUrls);
router.get('/info/:shortCode', urlController.getLinkInfo);
router.put('/update/:shortCode', urlController.updateLink);
router.delete('/delete/:shortCode', urlController.deleteLink);
router.get('/qr/:shortCode', urlController.generateQRCode);
router.get('/preview/:shortCode', urlController.previewLink);

module.exports = router;
