const INITIAL_STOCKS = [
  {
    "symbol": "AAPL",
    "name": "Apple"
  },
  {
    "symbol": "MSFT",
    "name": "Microsoft"
  },
  {
    "symbol": "NVDA",
    "name": "NVIDIA"
  },
  {
    "symbol": "GOOG",
    "name": "Alphabet"
  },
  {
    "symbol": "AMZN",
    "name": "Amazon"
  },
  {
    "symbol": "META",
    "name": "Meta Platforms"
  },
  {
    "symbol": "TSLA",
    "name": "Tesla"
  },
  {
    "symbol": "ADBE",
    "name": "Adobe"
  },
  {
    "symbol": "ADSK",
    "name": "Autodesk"
  },
  {
    "symbol": "ABNB",
    "name": "Airbnb"
  },
  {
    "symbol": "AVGO",
    "name": "Broadcom"
  },
  {
    "symbol": "ASML",
    "name": "ASML Holding"
  },
  {
    "symbol": "ARM",
    "name": "Arm Holdings"
  },
  {
    "symbol": "AXON",
    "name": "Axon Enterprise"
  },
  {
    "symbol": "BKNG",
    "name": "Booking Holdings"
  },
  {
    "symbol": "CDNS",
    "name": "Cadence Design Systems"
  },
  {
    "symbol": "CDW",
    "name": "CDW"
  },
  {
    "symbol": "CEG",
    "name": "Constellation Energy"
  },
  {
    "symbol": "CHTR",
    "name": "Charter Communications"
  },
  {
    "symbol": "CMCSA",
    "name": "Comcast"
  },
  {
    "symbol": "COST",
    "name": "Costco"
  },
  {
    "symbol": "CPRT",
    "name": "Copart"
  },
  {
    "symbol": "CRWD",
    "name": "CrowdStrike"
  },
  {
    "symbol": "CSCO",
    "name": "Cisco Systems"
  },
  {
    "symbol": "CSGP",
    "name": "CoStar Group"
  },
  {
    "symbol": "CTAS",
    "name": "Cintas"
  },
  {
    "symbol": "CTSH",
    "name": "Cognizant"
  },
  {
    "symbol": "DASH",
    "name": "DoorDash"
  },
  {
    "symbol": "DDOG",
    "name": "Datadog"
  },
  {
    "symbol": "DXCM",
    "name": "DexCom"
  },
  {
    "symbol": "EA",
    "name": "Electronic Arts"
  },
  {
    "symbol": "FANG",
    "name": "Diamondback Energy"
  },
  {
    "symbol": "FAST",
    "name": "Fastenal"
  },
  {
    "symbol": "FTNT",
    "name": "Fortinet"
  },
  {
    "symbol": "GEHC",
    "name": "GE HealthCare"
  },
  {
    "symbol": "GILD",
    "name": "Gilead Sciences"
  },
  {
    "symbol": "IDXX",
    "name": "IDEXX Laboratories"
  },
  {
    "symbol": "INTC",
    "name": "Intel"
  },
  {
    "symbol": "INTU",
    "name": "Intuit"
  },
  {
    "symbol": "ISRG",
    "name": "Intuitive Surgical"
  },
  {
    "symbol": "KDP",
    "name": "Keurig Dr Pepper"
  },
  {
    "symbol": "KHC",
    "name": "Kraft Heinz"
  },
  {
    "symbol": "KLAC",
    "name": "KLA"
  },
  {
    "symbol": "LRCX",
    "name": "Lam Research"
  },
  {
    "symbol": "LULU",
    "name": "Lululemon"
  },
  {
    "symbol": "MAR",
    "name": "Marriott"
  },
  {
    "symbol": "MCHP",
    "name": "Microchip Technology"
  },
  {
    "symbol": "MDLZ",
    "name": "Mondelez"
  },
  {
    "symbol": "MELI",
    "name": "MercadoLibre"
  },
  {
    "symbol": "MNST",
    "name": "Monster Beverage"
  },
  {
    "symbol": "MRVL",
    "name": "Marvell Technology"
  },
  {
    "symbol": "MSTR",
    "name": "Strategy"
  },
  {
    "symbol": "NFLX",
    "name": "Netflix"
  },
  {
    "symbol": "NXPI",
    "name": "NXP Semiconductors"
  },
  {
    "symbol": "ODFL",
    "name": "Old Dominion Freight Line"
  },
  {
    "symbol": "ON",
    "name": "ON Semiconductor"
  },
  {
    "symbol": "ORLY",
    "name": "O'Reilly Automotive"
  },
  {
    "symbol": "PANW",
    "name": "Palo Alto Networks"
  },
  {
    "symbol": "PAYX",
    "name": "Paychex"
  },
  {
    "symbol": "PCAR",
    "name": "PACCAR"
  },
  {
    "symbol": "PDD",
    "name": "PDD Holdings"
  },
  {
    "symbol": "PEP",
    "name": "PepsiCo"
  },
  {
    "symbol": "PLTR",
    "name": "Palantir"
  },
  {
    "symbol": "PYPL",
    "name": "PayPal"
  },
  {
    "symbol": "QCOM",
    "name": "QUALCOMM"
  },
  {
    "symbol": "REGN",
    "name": "Regeneron"
  },
  {
    "symbol": "ROST",
    "name": "Ross Stores"
  },
  {
    "symbol": "SBUX",
    "name": "Starbucks"
  },
  {
    "symbol": "SNPS",
    "name": "Synopsys"
  },
  {
    "symbol": "TEAM",
    "name": "Atlassian"
  },
  {
    "symbol": "TMUS",
    "name": "T-Mobile US"
  },
  {
    "symbol": "TTWO",
    "name": "Take-Two Interactive"
  },
  {
    "symbol": "TXN",
    "name": "Texas Instruments"
  },
  {
    "symbol": "VRTX",
    "name": "Vertex Pharmaceuticals"
  },
  {
    "symbol": "VRSK",
    "name": "Verisk Analytics"
  },
  {
    "symbol": "WDAY",
    "name": "Workday"
  },
  {
    "symbol": "XEL",
    "name": "Xcel Energy"
  },
  {
    "symbol": "ZS",
    "name": "Zscaler"
  },
  {
    "symbol": "APP",
    "name": "AppLovin"
  },
  {
    "symbol": "AMGN",
    "name": "Amgen"
  },
  {
    "symbol": "BKR",
    "name": "Baker Hughes"
  },
  {
    "symbol": "GF",
    "name": "GlobalFoundries"
  },
  {
    "symbol": "HON",
    "name": "Honeywell"
  },
  {
    "symbol": "LIN",
    "name": "Linde"
  },
  {
    "symbol": "ADP",
    "name": "Automatic Data Processing"
  },
  {
    "symbol": "SAP.DE",
    "name": "SAP"
  },
  {
    "symbol": "SIE.DE",
    "name": "Siemens"
  },
  {
    "symbol": "AIR.DE",
    "name": "Airbus"
  },
  {
    "symbol": "BAS.DE",
    "name": "BASF"
  },
  {
    "symbol": "BAYN.DE",
    "name": "Bayer"
  },
  {
    "symbol": "DTE.DE",
    "name": "Deutsche Telekom"
  },
  {
    "symbol": "EOAN.DE",
    "name": "E.ON"
  },
  {
    "symbol": "FME.DE",
    "name": "Fresenius Medical Care"
  },
  {
    "symbol": "FRE.DE",
    "name": "Fresenius"
  },
  {
    "symbol": "HEN3.DE",
    "name": "Henkel Vz."
  },
  {
    "symbol": "HNR1.DE",
    "name": "Hannover Rück"
  },
  {
    "symbol": "IFX.DE",
    "name": "Infineon"
  },
  {
    "symbol": "MTX.DE",
    "name": "MTU Aero Engines"
  },
  {
    "symbol": "MUV2.DE",
    "name": "Münchener Rück"
  },
  {
    "symbol": "PAH3.DE",
    "name": "Porsche Holding"
  },
  {
    "symbol": "P911.DE",
    "name": "Porsche AG"
  },
  {
    "symbol": "PUM.DE",
    "name": "Puma"
  },
  {
    "symbol": "RHM.DE",
    "name": "Rheinmetall"
  },
  {
    "symbol": "RWE.DE",
    "name": "RWE"
  },
  {
    "symbol": "SHL.DE",
    "name": "Siemens Healthineers"
  },
  {
    "symbol": "SRT3.DE",
    "name": "Sartorius Vz."
  },
  {
    "symbol": "SY1.DE",
    "name": "Symrise"
  },
  {
    "symbol": "VNA.DE",
    "name": "Vonovia"
  },
  {
    "symbol": "VOW3.DE",
    "name": "Volkswagen Vz."
  },
  {
    "symbol": "1COV.DE",
    "name": "Covestro"
  },
  {
    "symbol": "ADS.DE",
    "name": "Adidas"
  },
  {
    "symbol": "ALV.DE",
    "name": "Allianz"
  },
  {
    "symbol": "CBK.DE",
    "name": "Commerzbank"
  },
  {
    "symbol": "HFG.DE",
    "name": "HelloFresh"
  },
  {
    "symbol": "NDAQ",
    "name": "Nasdaq"
  },
  {
    "symbol": "TQQQ",
    "name": "ProShares UltraPro QQQ"
  },
  {
    "symbol": "SXRV.DE",
    "name": "iShares Nasdaq 100 ETF"
  },
  {
    "symbol": "DAX.DE",
    "name": "DAX ETF / Index-Platzhalter"
  }
];
