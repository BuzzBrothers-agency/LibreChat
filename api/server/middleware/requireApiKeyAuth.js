const { getAppConfig } = require('~/server/services/Config/app');
const { extractEnvVariable } = require('librechat-data-provider');

/**
 * Custom Middleware to handle API key authentication for admin routes.
 */
const requireApiKeyAuth = async (req, res, next) => {
  // Check if admin access is enabled in the app config
  const appConfig = await getAppConfig();
  if (!appConfig.adminAccess) {
    return res.status(403).json({ error: 'Admin access is disabled' });
  }

  // search for the api key in the admin access list
  const apiKey = req.headers['x-api-key'];

  // get the adminAccess corresponding to the passed apiKey
  const adminAccess = appConfig.adminAccess
    .map((access) => {
      return {
        ...access,
        apiKey: extractEnvVariable(access.apiKey ?? ''),
      };
    })
    .find((access) => access.apiKey === apiKey);

  // If no matching API key is found, return 403 Forbidden
  if (!adminAccess) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  // All good, proceed next
  return next();
};

module.exports = requireApiKeyAuth;
