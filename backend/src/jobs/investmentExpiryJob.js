const cron = require(
  "node-cron"
);

const processExpiredInvestments =
  require(
    "../services/investmentExpiryService"
  );

const startInvestmentExpiryJob =
  () => {
    cron.schedule(
      "0 * * * *",
      async () => {
        await processExpiredInvestments();
      }
    );
  };

module.exports =
  startInvestmentExpiryJob;