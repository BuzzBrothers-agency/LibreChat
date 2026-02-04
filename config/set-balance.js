const path = require('path');
const mongoose = require('mongoose');
const { getBalanceConfig, model } = require('@librechat/api');
const { User, Balance } = require('@librechat/data-schemas').createModels(mongoose);
const dataProviders = require('@librechat/api');
require('module-alias')({ base: path.resolve(__dirname, '..', 'api') });
const { askQuestion, silentExit } = require('./helpers');
const connect = require('./connect');
const { camelCase } = require('lodash');

(async () => {
  await connect();

  /**
   * Show the welcome / help menu
   */
  console.purple('--------------------------');
  console.purple('Set balance to a user account!');
  console.purple('--------------------------');
  /**
   * Set up the variables we need and get the arguments if they were passed in
   */
  let email = '';
  let amount = '';
  let spec = '';

  const balanceConfig = getBalanceConfig();
  console.log(balanceConfig);
  if (!balanceConfig?.enabled) {
    console.red('Error: Balance is not enabled. Use librechat.yaml to enable it');
    silentExit(1);
  }

  // If we have the right number of arguments, lets use them
  if (process.argv.length >= balanceConfig.perSpec ? 4 : 3) {
    email = process.argv[2];
    amount = process.argv[3];
    spec = process.argv[4];
  } else {
    console.orange(
      `Usage: npm run set-balance <email> <amount> ${balanceConfig.perSpec ? '<spec>' : ''}`,
    );
    console.orange('Note: if you do not pass in the arguments, you will be prompted for them.');
    console.purple('--------------------------');
    // console.purple(`[DEBUG] Args Length: ${process.argv.length}`);
  }

  /**
   * If we don't have the right number of arguments, lets prompt the user for them
   */
  if (!email) {
    email = await askQuestion('Email:');
  }
  // Validate the email
  if (!email.includes('@')) {
    console.red('Error: Invalid email address!');
    silentExit(1);
  }

  // Validate the user
  const user = await User.findOne({ email }).lean();
  if (!user) {
    console.red('Error: No user with that email was found!');
    silentExit(1);
  } else {
    console.purple(`Found user: ${user.email}`);
  }

  let balance = await Balance.findOne({ user: user._id }).lean();
  if (!balance) {
    console.purple('User has no balance!');
  } else {
    if (balanceConfig.perSpec) {
      console.purple(`Current balance: ${balance.tokenCredits}`);
      console.orange('Per spec balances:');
      for (const [specName, specBalance] of Object.entries(balance.perSpecTokenCredits || {})) {
        console.orange(`- ${specName}: ${specBalance}`);
      }
    } else {
      console.purple(`Current Balance: ${balance.tokenCredits}`);
    }
  }

  // Get the amount if not provided
  if (!amount) {
    amount = await askQuestion('amount:');
  }
  // Validate the amount
  if (!amount) {
    console.red('Error: Please specify an amount!');
    silentExit(1);
  }

  // Asking the model you want to set balance for
  if (balanceConfig.perSpec && !spec) {
    spec = await askQuestion('Spec (null):');
  }

  /**
   * Now that we have all the variables we need, lets set the balance
   */
  let result;
  try {
    if (balanceConfig.perSpec && spec) {
      result = await Balance.findOneAndUpdate(
        { user: user._id },
        { $set: { [`perSpecTokenCredits.${camelCase(spec)}`]: amount } },
        { upsert: true, new: true },
      ).lean();
    } else {
      result = await Balance.findOneAndUpdate(
        { user: user._id },
        { tokenCredits: amount },
        { upsert: true, new: true },
      ).lean();
    }

  } catch (error) {
    console.red('Error: ' + error.message);
    console.error(error);
    silentExit(1);
  }

  // Check the result
  if (result?.tokenCredits == null) {
    console.red('Error: Something went wrong while updating the balance!');
    console.error(result);
    silentExit(1);
  }

  // Print out the new balance
  console.green('Balance set successfully!');
  if (spec) {
    console.purple(`New Balance for spsec ${spec}: ${amount}`);
  } else {
    console.purple(`New Balance: ${result.tokenCredits}`);
  }

  // Done!
  silentExit(0);
})();

process.on('uncaughtException', (err) => {
  if (!err.message.includes('fetch failed')) {
    console.error('There was an uncaught error:');
    console.error(err);
  }

  if (err.message.includes('fetch failed')) {
    return;
  } else {
    process.exit(1);
  }
});
