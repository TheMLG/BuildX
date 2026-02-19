import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import { TAX_RATE } from '../utils/constants.js';

// Get application configuration
export const getConfig = asyncHandler(async (req, res) => {
  const config = {
    taxRate: TAX_RATE,
    currency: 'INR',
    currencySymbol: '₹',
  };

  res.status(200).json(
    new ApiResponse(200, config, 'Configuration fetched successfully')
  );
});
