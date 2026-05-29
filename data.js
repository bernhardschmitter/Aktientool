const INITIAL_STOCKS = [
  {
    "symbol": "ADS.DE",
    "name": "ADS.DE",
    "group": "DAX40"
  },
  {
    "symbol": "AIR.DE",
    "name": "AIR.DE",
    "group": "DAX40"
  },
  {
    "symbol": "ALV.DE",
    "name": "ALV.DE",
    "group": "DAX40"
  },
  {
    "symbol": "BAS.DE",
    "name": "BAS.DE",
    "group": "DAX40"
  },
  {
    "symbol": "BAYN.DE",
    "name": "BAYN.DE",
    "group": "DAX40"
  },
  {
    "symbol": "BEI.DE",
    "name": "BEI.DE",
    "group": "DAX40"
  },
  {
    "symbol": "BMW.DE",
    "name": "BMW.DE",
    "group": "DAX40"
  },
  {
    "symbol": "BNR",
    "name": "BNR",
    "group": "DAX40"
  },
  {
    "symbol": "CBK.DE",
    "name": "CBK.DE",
    "group": "DAX40"
  },
  {
    "symbol": "CON",
    "name": "CON",
    "group": "DAX40"
  },
  {
    "symbol": "1COV.DE",
    "name": "1COV.DE",
    "group": "DAX40"
  },
  {
    "symbol": "DTG",
    "name": "DTG",
    "group": "DAX40"
  },
  {
    "symbol": "DBK.DE",
    "name": "DBK.DE",
    "group": "DAX40"
  },
  {
    "symbol": "DB1.DE",
    "name": "DB1.DE",
    "group": "DAX40"
  },
  {
    "symbol": "DHL.DE",
    "name": "DHL.DE",
    "group": "DAX40"
  },
  {
    "symbol": "DTE.DE",
    "name": "DTE.DE",
    "group": "DAX40"
  },
  {
    "symbol": "EOAN.DE",
    "name": "EOAN.DE",
    "group": "DAX40"
  },
  {
    "symbol": "FME.DE",
    "name": "FME.DE",
    "group": "DAX40"
  },
  {
    "symbol": "FRE.DE",
    "name": "FRE.DE",
    "group": "DAX40"
  },
  {
    "symbol": "HNR1.DE",
    "name": "HNR1.DE",
    "group": "DAX40"
  },
  {
    "symbol": "HFG.DE",
    "name": "HFG.DE",
    "group": "DAX40"
  },
  {
    "symbol": "HEN3.DE",
    "name": "HEN3.DE",
    "group": "DAX40"
  },
  {
    "symbol": "IFX.DE",
    "name": "IFX.DE",
    "group": "DAX40"
  },
  {
    "symbol": "MBG.DE",
    "name": "MBG.DE",
    "group": "DAX40"
  },
  {
    "symbol": "MRK.DE",
    "name": "MRK.DE",
    "group": "DAX40"
  },
  {
    "symbol": "MTX.DE",
    "name": "MTX.DE",
    "group": "DAX40"
  },
  {
    "symbol": "MUV2.DE",
    "name": "MUV2.DE",
    "group": "DAX40"
  },
  {
    "symbol": "P911.DE",
    "name": "P911.DE",
    "group": "DAX40"
  },
  {
    "symbol": "PAH3.DE",
    "name": "PAH3.DE",
    "group": "DAX40"
  },
  {
    "symbol": "PUM.DE",
    "name": "PUM.DE",
    "group": "DAX40"
  },
  {
    "symbol": "QIA.DE",
    "name": "QIA.DE",
    "group": "DAX40"
  },
  {
    "symbol": "RHM.DE",
    "name": "RHM.DE",
    "group": "DAX40"
  },
  {
    "symbol": "RWE.DE",
    "name": "RWE.DE",
    "group": "DAX40"
  },
  {
    "symbol": "SAP.DE",
    "name": "SAP.DE",
    "group": "DAX40"
  },
  {
    "symbol": "SRT3.DE",
    "name": "SRT3.DE",
    "group": "DAX40"
  },
  {
    "symbol": "SIE.DE",
    "name": "SIE.DE",
    "group": "DAX40"
  },
  {
    "symbol": "ENR.DE",
    "name": "ENR.DE",
    "group": "DAX40"
  },
  {
    "symbol": "SHL.DE",
    "name": "SHL.DE",
    "group": "DAX40"
  },
  {
    "symbol": "SY1.DE",
    "name": "SY1.DE",
    "group": "DAX40"
  },
  {
    "symbol": "VOW3.DE",
    "name": "VOW3.DE",
    "group": "DAX40"
  },
  {
    "symbol": "VNA.DE",
    "name": "VNA.DE",
    "group": "DAX40"
  },
  {
    "symbol": "TESG.sg",
    "name": "TESG.sg",
    "group": "EFT"
  },
  {
    "symbol": "ADBE",
    "name": "ADBE",
    "group": "Nasdaq"
  },
  {
    "symbol": "AMD",
    "name": "AMD",
    "group": "Nasdaq"
  },
  {
    "symbol": "ABNB",
    "name": "ABNB",
    "group": "Nasdaq"
  },
  {
    "symbol": "GOOGL",
    "name": "GOOGL",
    "group": "Nasdaq"
  },
  {
    "symbol": "GOOG",
    "name": "GOOG",
    "group": "Nasdaq"
  },
  {
    "symbol": "AMZN",
    "name": "AMZN",
    "group": "Nasdaq"
  },
  {
    "symbol": "AEP",
    "name": "AEP",
    "group": "Nasdaq"
  },
  {
    "symbol": "AMGN",
    "name": "AMGN",
    "group": "Nasdaq"
  },
  {
    "symbol": "ADI",
    "name": "ADI",
    "group": "Nasdaq"
  },
  {
    "symbol": "AAPL",
    "name": "AAPL",
    "group": "Nasdaq"
  },
  {
    "symbol": "AMAT",
    "name": "AMAT",
    "group": "Nasdaq"
  },
  {
    "symbol": "APP",
    "name": "APP",
    "group": "Nasdaq"
  },
  {
    "symbol": "ARM",
    "name": "ARM",
    "group": "Nasdaq"
  },
  {
    "symbol": "ASML",
    "name": "ASML",
    "group": "Nasdaq"
  },
  {
    "symbol": "AZN",
    "name": "AZN",
    "group": "Nasdaq"
  },
  {
    "symbol": "TEAM",
    "name": "TEAM",
    "group": "Nasdaq"
  },
  {
    "symbol": "ADSK",
    "name": "ADSK",
    "group": "Nasdaq"
  },
  {
    "symbol": "ADP",
    "name": "ADP",
    "group": "Nasdaq"
  },
  {
    "symbol": "AXON",
    "name": "AXON",
    "group": "Nasdaq"
  },
  {
    "symbol": "BKR",
    "name": "BKR",
    "group": "Nasdaq"
  },
  {
    "symbol": "BIB",
    "name": "BIB",
    "group": "Nasdaq"
  },
  {
    "symbol": "BKNG",
    "name": "BKNG",
    "group": "Nasdaq"
  },
  {
    "symbol": "AVGO",
    "name": "AVGO",
    "group": "Nasdaq"
  },
  {
    "symbol": "CDNS",
    "name": "CDNS",
    "group": "Nasdaq"
  },
  {
    "symbol": "CDW",
    "name": "CDW",
    "group": "Nasdaq"
  },
  {
    "symbol": "CHTR",
    "name": "CHTR",
    "group": "Nasdaq"
  },
  {
    "symbol": "CTAS",
    "name": "CTAS",
    "group": "Nasdaq"
  },
  {
    "symbol": "CSCO",
    "name": "CSCO",
    "group": "Nasdaq"
  },
  {
    "symbol": "CCEP",
    "name": "CCEP",
    "group": "Nasdaq"
  },
  {
    "symbol": "CTSH",
    "name": "CTSH",
    "group": "Nasdaq"
  },
  {
    "symbol": "CMCSA",
    "name": "CMCSA",
    "group": "Nasdaq"
  },
  {
    "symbol": "CEG",
    "name": "CEG",
    "group": "Nasdaq"
  },
  {
    "symbol": "CPRT",
    "name": "CPRT",
    "group": "Nasdaq"
  },
  {
    "symbol": "CSGP",
    "name": "CSGP",
    "group": "Nasdaq"
  },
  {
    "symbol": "COST",
    "name": "COST",
    "group": "Nasdaq"
  },
  {
    "symbol": "CRWD",
    "name": "CRWD",
    "group": "Nasdaq"
  },
  {
    "symbol": "CSX",
    "name": "CSX",
    "group": "Nasdaq"
  },
  {
    "symbol": "DDOG",
    "name": "DDOG",
    "group": "Nasdaq"
  },
  {
    "symbol": "DXCM",
    "name": "DXCM",
    "group": "Nasdaq"
  },
  {
    "symbol": "FANG",
    "name": "FANG",
    "group": "Nasdaq"
  },
  {
    "symbol": "DASH",
    "name": "DASH",
    "group": "Nasdaq"
  },
  {
    "symbol": "EA",
    "name": "EA",
    "group": "Nasdaq"
  },
  {
    "symbol": "EXC",
    "name": "EXC",
    "group": "Nasdaq"
  },
  {
    "symbol": "FAST",
    "name": "FAST",
    "group": "Nasdaq"
  },
  {
    "symbol": "FTNT",
    "name": "FTNT",
    "group": "Nasdaq"
  },
  {
    "symbol": "GEHC",
    "name": "GEHC",
    "group": "Nasdaq"
  },
  {
    "symbol": "GILD",
    "name": "GILD",
    "group": "Nasdaq"
  },
  {
    "symbol": "GFS",
    "name": "GFS",
    "group": "Nasdaq"
  },
  {
    "symbol": "HON",
    "name": "HON",
    "group": "Nasdaq"
  },
  {
    "symbol": "IDXX",
    "name": "IDXX",
    "group": "Nasdaq"
  },
  {
    "symbol": "INTC",
    "name": "INTC",
    "group": "Nasdaq"
  },
  {
    "symbol": "INTU",
    "name": "INTU",
    "group": "Nasdaq"
  },
  {
    "symbol": "ISRG",
    "name": "ISRG",
    "group": "Nasdaq"
  },
  {
    "symbol": "INTC",
    "name": "INTC",
    "group": "Nasdaq"
  },
  {
    "symbol": "KDP",
    "name": "KDP",
    "group": "Nasdaq"
  },
  {
    "symbol": "KLAC",
    "name": "KLAC",
    "group": "Nasdaq"
  },
  {
    "symbol": "KHC",
    "name": "KHC",
    "group": "Nasdaq"
  },
  {
    "symbol": "LRCX",
    "name": "LRCX",
    "group": "Nasdaq"
  },
  {
    "symbol": "LIN",
    "name": "LIN",
    "group": "Nasdaq"
  },
  {
    "symbol": "LULU",
    "name": "LULU",
    "group": "Nasdaq"
  },
  {
    "symbol": "MAR",
    "name": "MAR",
    "group": "Nasdaq"
  },
  {
    "symbol": "MRVL",
    "name": "MRVL",
    "group": "Nasdaq"
  },
  {
    "symbol": "MELI",
    "name": "MELI",
    "group": "Nasdaq"
  },
  {
    "symbol": "META",
    "name": "META",
    "group": "Nasdaq"
  },
  {
    "symbol": "MCHP",
    "name": "MCHP",
    "group": "Nasdaq"
  },
  {
    "symbol": "MU",
    "name": "MU",
    "group": "Nasdaq"
  },
  {
    "symbol": "MSFT",
    "name": "MSFT",
    "group": "Nasdaq"
  },
  {
    "symbol": "MSTR",
    "name": "MSTR",
    "group": "Nasdaq"
  },
  {
    "symbol": "MDLZ",
    "name": "MDLZ",
    "group": "Nasdaq"
  },
  {
    "symbol": "MNST",
    "name": "MNST",
    "group": "Nasdaq"
  },
  {
    "symbol": "NFLX",
    "name": "NFLX",
    "group": "Nasdaq"
  },
  {
    "symbol": "NVDA",
    "name": "NVDA",
    "group": "Nasdaq"
  },
  {
    "symbol": "NXPI",
    "name": "NXPI",
    "group": "Nasdaq"
  },
  {
    "symbol": "ORLY",
    "name": "ORLY",
    "group": "Nasdaq"
  },
  {
    "symbol": "ODFL",
    "name": "ODFL",
    "group": "Nasdaq"
  },
  {
    "symbol": "ON",
    "name": "ON",
    "group": "Nasdaq"
  },
  {
    "symbol": "PCAR",
    "name": "PCAR",
    "group": "Nasdaq"
  },
  {
    "symbol": "PLTR",
    "name": "PLTR",
    "group": "Nasdaq"
  },
  {
    "symbol": "PANW",
    "name": "PANW",
    "group": "Nasdaq"
  },
  {
    "symbol": "PAYX",
    "name": "PAYX",
    "group": "Nasdaq"
  },
  {
    "symbol": "PYPL",
    "name": "PYPL",
    "group": "Nasdaq"
  },
  {
    "symbol": "PDD",
    "name": "PDD",
    "group": "Nasdaq"
  },
  {
    "symbol": "PEP",
    "name": "PEP",
    "group": "Nasdaq"
  },
  {
    "symbol": "QCOM",
    "name": "QCOM",
    "group": "Nasdaq"
  },
  {
    "symbol": "REGN",
    "name": "REGN",
    "group": "Nasdaq"
  },
  {
    "symbol": "ROP",
    "name": "ROP",
    "group": "Nasdaq"
  },
  {
    "symbol": "ROST",
    "name": "ROST",
    "group": "Nasdaq"
  },
  {
    "symbol": "SHOP",
    "name": "SHOP",
    "group": "Nasdaq"
  },
  {
    "symbol": "SBUX",
    "name": "SBUX",
    "group": "Nasdaq"
  },
  {
    "symbol": "SNPS",
    "name": "SNPS",
    "group": "Nasdaq"
  },
  {
    "symbol": "TMUS",
    "name": "TMUS",
    "group": "Nasdaq"
  },
  {
    "symbol": "TTWO",
    "name": "TTWO",
    "group": "Nasdaq"
  },
  {
    "symbol": "TSLA",
    "name": "TSLA",
    "group": "Nasdaq"
  },
  {
    "symbol": "TXN",
    "name": "TXN",
    "group": "Nasdaq"
  },
  {
    "symbol": "TRI",
    "name": "TRI",
    "group": "Nasdaq"
  },
  {
    "symbol": "TTD",
    "name": "TTD",
    "group": "Nasdaq"
  },
  {
    "symbol": "VRSK",
    "name": "VRSK",
    "group": "Nasdaq"
  },
  {
    "symbol": "VRTX",
    "name": "VRTX",
    "group": "Nasdaq"
  },
  {
    "symbol": "WBD",
    "name": "WBD",
    "group": "Nasdaq"
  },
  {
    "symbol": "WDAY",
    "name": "WDAY",
    "group": "Nasdaq"
  },
  {
    "symbol": "XEL",
    "name": "XEL",
    "group": "Nasdaq"
  },
  {
    "symbol": "ZS",
    "name": "ZS",
    "group": "Nasdaq"
  }
];
