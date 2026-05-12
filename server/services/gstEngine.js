const calculateGST = (amount, taxRate, type = 'intra') => {
  const taxAmount = (amount * taxRate) / 100;
  
  if (type === 'intra') {
    // Intra-state: CGST + SGST
    return {
      cgst: taxAmount / 2,
      sgst: taxAmount / 2,
      igst: 0,
      totalAmount: amount + taxAmount
    };
  } else {
    // Inter-state: IGST
    return {
      cgst: 0,
      sgst: 0,
      igst: taxAmount,
      totalAmount: amount + taxAmount
    };
  }
};

const calculateNetLiability = (outputTax, inputTaxCredit) => {
  return Math.max(0, outputTax - inputTaxCredit);
};

export { calculateGST, calculateNetLiability };
