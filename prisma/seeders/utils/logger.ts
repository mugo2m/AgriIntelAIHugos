export const logger = {
  title(message: string) {
    console.log("");
    console.log("====================================================");
    console.log(message);
    console.log("====================================================");
  },

  info(message: string) {
    console.log(`â„¹ ${message}`);
  },

  success(message: string) {
    console.log(`âœ… ${message}`);
  },

  warning(message: string) {
    console.log(`âš  ${message}`);
  },

  error(message: string) {
    console.log(`âŒ ${message}`);
  },

  done() {
    console.log("----------------------------------------------------");
  },
};


