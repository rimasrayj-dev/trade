// ── STOCKS ──
// Candles + quotes : Yahoo Finance (no key, CORS-friendly, session-aligned)
// Live price ticks : Finnhub WebSocket (keeps real-time updates)

const FINNHUB_KEY  = 'd7e050hr01qkuebig1egd7e050hr01qkuebig1f0';
const FINNHUB_WS   = `wss://ws.finnhub.io?token=${FINNHUB_KEY}`;

const FINNHUB_REST = 'https://finnhub.io/api/v1';

// Strip exchange prefix for display (e.g. "LSE:SHEL" → "SHEL")
// kept for renderStockPairs / selStock which call _dispSym/_exchLabel

const STOCK_WATCHLIST = [
  // Tech: Mega-cap
  { sym:'AAPL',  name:'Apple',                 sector:'Tech' },
  { sym:'MSFT',  name:'Microsoft',             sector:'Tech' },
  { sym:'NVDA',  name:'NVIDIA',                sector:'Tech' },
  { sym:'GOOGL', name:'Alphabet',              sector:'Tech' },
  { sym:'AMZN',  name:'Amazon',                sector:'Tech' },
  { sym:'META',  name:'Meta',                  sector:'Tech' },
  { sym:'TSLA',  name:'Tesla',                 sector:'Tech' },
  { sym:'NFLX',  name:'Netflix',               sector:'Tech' },
  // Semiconductors
  { sym:'AMD',   name:'AMD',                   sector:'Semiconductors' },
  { sym:'INTC',  name:'Intel',                 sector:'Semiconductors' },
  { sym:'QCOM',  name:'Qualcomm',              sector:'Semiconductors' },
  { sym:'AVGO',  name:'Broadcom',              sector:'Semiconductors' },
  { sym:'TXN',   name:'Texas Instruments',     sector:'Semiconductors' },
  { sym:'MU',    name:'Micron Technology',     sector:'Semiconductors' },
  { sym:'AMAT',  name:'Applied Materials',     sector:'Semiconductors' },
  { sym:'LRCX',  name:'Lam Research',          sector:'Semiconductors' },
  { sym:'KLAC',  name:'KLA Corporation',       sector:'Semiconductors' },
  { sym:'MRVL',  name:'Marvell Technology',    sector:'Semiconductors' },
  { sym:'ON',    name:'ON Semiconductor',      sector:'Semiconductors' },
  { sym:'SWKS',  name:'Skyworks Solutions',    sector:'Semiconductors' },
  { sym:'MPWR',  name:'Monolithic Power',      sector:'Semiconductors' },
  { sym:'ADI',   name:'Analog Devices',        sector:'Semiconductors' },
  { sym:'NXPI',  name:'NXP Semiconductors',    sector:'Semiconductors' },
  { sym:'STM',   name:'STMicroelectronics',    sector:'Semiconductors' },
  { sym:'WOLF',  name:'Wolfspeed',             sector:'Semiconductors' },
  // Software
  { sym:'CRM',   name:'Salesforce',            sector:'Software' },
  { sym:'ORCL',  name:'Oracle',                sector:'Software' },
  { sym:'ADBE',  name:'Adobe',                 sector:'Software' },
  { sym:'NOW',   name:'ServiceNow',            sector:'Software' },
  { sym:'INTU',  name:'Intuit',                sector:'Software' },
  { sym:'WDAY',  name:'Workday',               sector:'Software' },
  { sym:'SNOW',  name:'Snowflake',             sector:'Software' },
  { sym:'PLTR',  name:'Palantir',              sector:'Software' },
  { sym:'DDOG',  name:'Datadog',               sector:'Software' },
  { sym:'MDB',   name:'MongoDB',               sector:'Software' },
  { sym:'CRWD',  name:'CrowdStrike',           sector:'Software' },
  { sym:'ZS',    name:'Zscaler',               sector:'Software' },
  { sym:'NET',   name:'Cloudflare',            sector:'Software' },
  { sym:'FTNT',  name:'Fortinet',              sector:'Software' },
  { sym:'PANW',  name:'Palo Alto Networks',    sector:'Software' },
  { sym:'OKTA',  name:'Okta',                  sector:'Software' },
  { sym:'TEAM',  name:'Atlassian',             sector:'Software' },
  { sym:'HUBS',  name:'HubSpot',               sector:'Software' },
  { sym:'ZM',    name:'Zoom Video',            sector:'Software' },
  { sym:'TWLO',  name:'Twilio',                sector:'Software' },
  { sym:'PATH',  name:'UiPath',                sector:'Software' },
  { sym:'GTLB',  name:'GitLab',                sector:'Software' },
  { sym:'BILL',  name:'Bill.com',              sector:'Software' },
  { sym:'BSY',   name:'Bentley Systems',       sector:'Software' },
  { sym:'DOCU',  name:'DocuSign',              sector:'Software' },
  // Internet & E-commerce
  { sym:'SHOP',  name:'Shopify',               sector:'Internet' },
  { sym:'BABA',  name:'Alibaba',               sector:'Internet' },
  { sym:'JD',    name:'JD.com',                sector:'Internet' },
  { sym:'PINS',  name:'Pinterest',             sector:'Internet' },
  { sym:'SNAP',  name:'Snap',                  sector:'Internet' },
  { sym:'RDDT',  name:'Reddit',                sector:'Internet' },
  { sym:'UBER',  name:'Uber',                  sector:'Internet' },
  { sym:'LYFT',  name:'Lyft',                  sector:'Internet' },
  { sym:'ABNB',  name:'Airbnb',                sector:'Internet' },
  { sym:'DASH',  name:'DoorDash',              sector:'Internet' },
  { sym:'EXPE',  name:'Expedia',               sector:'Internet' },
  { sym:'BKNG',  name:'Booking Holdings',      sector:'Internet' },
  { sym:'TRIP',  name:'TripAdvisor',           sector:'Internet' },
  { sym:'ETSY',  name:'Etsy',                  sector:'Internet' },
  { sym:'EBAY',  name:'eBay',                  sector:'Internet' },
  { sym:'IAC',   name:'IAC',                   sector:'Internet' },
  // Hardware & Storage
  { sym:'HPQ',   name:'HP Inc.',               sector:'Hardware' },
  { sym:'HPE',   name:'HP Enterprise',         sector:'Hardware' },
  { sym:'DELL',  name:'Dell Technologies',     sector:'Hardware' },
  { sym:'STX',   name:'Seagate Technology',    sector:'Hardware' },
  { sym:'WDC',   name:'Western Digital',       sector:'Hardware' },
  { sym:'PSTG',  name:'Pure Storage',          sector:'Hardware' },
  { sym:'NTAP',  name:'NetApp',                sector:'Hardware' },
  { sym:'ZBRA',  name:'Zebra Technologies',    sector:'Hardware' },
  // Banks
  { sym:'JPM',   name:'JPMorgan Chase',        sector:'Banks' },
  { sym:'BAC',   name:'Bank of America',       sector:'Banks' },
  { sym:'WFC',   name:'Wells Fargo',           sector:'Banks' },
  { sym:'C',     name:'Citigroup',             sector:'Banks' },
  { sym:'USB',   name:'US Bancorp',            sector:'Banks' },
  { sym:'PNC',   name:'PNC Financial',         sector:'Banks' },
  { sym:'TFC',   name:'Truist Financial',      sector:'Banks' },
  { sym:'KEY',   name:'KeyCorp',               sector:'Banks' },
  { sym:'CFG',   name:'Citizens Financial',    sector:'Banks' },
  { sym:'RF',    name:'Regions Financial',     sector:'Banks' },
  { sym:'FITB',  name:'Fifth Third Bancorp',   sector:'Banks' },
  { sym:'HBAN',  name:'Huntington Bancshares', sector:'Banks' },
  // Investment & Asset Management
  { sym:'GS',    name:'Goldman Sachs',         sector:'Finance' },
  { sym:'MS',    name:'Morgan Stanley',        sector:'Finance' },
  { sym:'BLK',   name:'BlackRock',             sector:'Finance' },
  { sym:'BX',    name:'Blackstone',            sector:'Finance' },
  { sym:'KKR',   name:'KKR & Co.',             sector:'Finance' },
  { sym:'APO',   name:'Apollo Global',         sector:'Finance' },
  { sym:'ARES',  name:'Ares Management',       sector:'Finance' },
  { sym:'BAM',   name:'Brookfield Asset Mgmt', sector:'Finance' },
  { sym:'SCHW',  name:'Charles Schwab',        sector:'Finance' },
  { sym:'RJF',   name:'Raymond James',         sector:'Finance' },
  // Payments & Fintech
  { sym:'V',     name:'Visa',                  sector:'Fintech' },
  { sym:'MA',    name:'Mastercard',            sector:'Fintech' },
  { sym:'PYPL',  name:'PayPal',                sector:'Fintech' },
  { sym:'SQ',    name:'Block (Square)',         sector:'Fintech' },
  { sym:'AFRM',  name:'Affirm',                sector:'Fintech' },
  { sym:'SOFI',  name:'SoFi Technologies',     sector:'Fintech' },
  { sym:'COIN',  name:'Coinbase',              sector:'Fintech' },
  { sym:'HOOD',  name:'Robinhood',             sector:'Fintech' },
  { sym:'NU',    name:'Nu Holdings',           sector:'Fintech' },
  { sym:'FIS',   name:'Fidelity Natl Info',    sector:'Fintech' },
  { sym:'FI',    name:'Fiserv',                sector:'Fintech' },
  { sym:'GPN',   name:'Global Payments',       sector:'Fintech' },
  // Insurance
  { sym:'BRK.B', name:'Berkshire Hathaway',    sector:'Insurance' },
  { sym:'MET',   name:'MetLife',               sector:'Insurance' },
  { sym:'PRU',   name:'Prudential',            sector:'Insurance' },
  { sym:'AFL',   name:'Aflac',                 sector:'Insurance' },
  { sym:'AIG',   name:'AIG',                   sector:'Insurance' },
  { sym:'ALL',   name:'Allstate',              sector:'Insurance' },
  { sym:'PGR',   name:'Progressive',           sector:'Insurance' },
  { sym:'CB',    name:'Chubb',                 sector:'Insurance' },
  { sym:'HIG',   name:'Hartford Financial',    sector:'Insurance' },
  { sym:'TRV',   name:'Travelers',             sector:'Insurance' },
  // Retail
  { sym:'WMT',   name:'Walmart',               sector:'Retail' },
  { sym:'COST',  name:'Costco',                sector:'Retail' },
  { sym:'TGT',   name:'Target',                sector:'Retail' },
  { sym:'HD',    name:'Home Depot',            sector:'Retail' },
  { sym:'LOW',   name:'Lowes',                 sector:'Retail' },
  { sym:'TJX',   name:'TJX Companies',         sector:'Retail' },
  { sym:'ROSS',  name:'Ross Stores',           sector:'Retail' },
  { sym:'DLTR',  name:'Dollar Tree',           sector:'Retail' },
  { sym:'DG',    name:'Dollar General',        sector:'Retail' },
  { sym:'BBY',   name:'Best Buy',              sector:'Retail' },
  { sym:'KR',    name:'Kroger',                sector:'Retail' },
  { sym:'AZO',   name:'AutoZone',              sector:'Retail' },
  { sym:'ORLY',  name:'OReilly Auto Parts',    sector:'Retail' },
  // Food & Beverage
  { sym:'MCD',   name:'McDonalds',             sector:'Food & Bev' },
  { sym:'SBUX',  name:'Starbucks',             sector:'Food & Bev' },
  { sym:'YUM',   name:'Yum! Brands',           sector:'Food & Bev' },
  { sym:'CMG',   name:'Chipotle',              sector:'Food & Bev' },
  { sym:'DPZ',   name:'Dominos Pizza',         sector:'Food & Bev' },
  { sym:'QSR',   name:'Restaurant Brands',     sector:'Food & Bev' },
  { sym:'KO',    name:'Coca-Cola',             sector:'Food & Bev' },
  { sym:'PEP',   name:'PepsiCo',               sector:'Food & Bev' },
  { sym:'MDLZ',  name:'Mondelez',              sector:'Food & Bev' },
  { sym:'GIS',   name:'General Mills',         sector:'Food & Bev' },
  { sym:'HSY',   name:'Hershey',               sector:'Food & Bev' },
  { sym:'STZ',   name:'Constellation Brands',  sector:'Food & Bev' },
  { sym:'BUD',   name:'Anheuser-Busch InBev',  sector:'Food & Bev' },
  { sym:'TAP',   name:'Molson Coors',          sector:'Food & Bev' },
  { sym:'K',     name:'Kellanova',             sector:'Food & Bev' },
  // Apparel & Luxury
  { sym:'NKE',   name:'Nike',                  sector:'Apparel' },
  { sym:'LULU',  name:'Lululemon',             sector:'Apparel' },
  { sym:'PVH',   name:'PVH Corp',              sector:'Apparel' },
  { sym:'RL',    name:'Ralph Lauren',          sector:'Apparel' },
  { sym:'TPR',   name:'Tapestry',              sector:'Apparel' },
  { sym:'CPRI',  name:'Capri Holdings',        sector:'Apparel' },
  { sym:'VFC',   name:'VF Corporation',        sector:'Apparel' },
  { sym:'UAA',   name:'Under Armour',          sector:'Apparel' },
  // Autos & EVs
  { sym:'GM',    name:'General Motors',        sector:'Autos' },
  { sym:'F',     name:'Ford Motor',            sector:'Autos' },
  { sym:'RIVN',  name:'Rivian',                sector:'Autos' },
  { sym:'LCID',  name:'Lucid Group',           sector:'Autos' },
  { sym:'NIO',   name:'NIO',                   sector:'Autos' },
  { sym:'LI',    name:'Li Auto',               sector:'Autos' },
  { sym:'XPEV',  name:'XPeng',                 sector:'Autos' },
  { sym:'RACE',  name:'Ferrari',               sector:'Autos' },
  { sym:'TM',    name:'Toyota',                sector:'Autos' },
  { sym:'HMC',   name:'Honda',                 sector:'Autos' },
  // Media & Entertainment
  { sym:'DIS',   name:'Disney',                sector:'Media' },
  { sym:'SPOT',  name:'Spotify',               sector:'Media' },
  { sym:'WBD',   name:'Warner Bros Discovery', sector:'Media' },
  { sym:'PARA',  name:'Paramount Global',      sector:'Media' },
  { sym:'FOX',   name:'Fox Corporation',       sector:'Media' },
  { sym:'NYT',   name:'New York Times',        sector:'Media' },
  { sym:'LYV',   name:'Live Nation',           sector:'Media' },
  { sym:'IMAX',  name:'IMAX Corporation',      sector:'Media' },
  { sym:'EA',    name:'Electronic Arts',       sector:'Media' },
  { sym:'TTWO',  name:'Take-Two Interactive',  sector:'Media' },
  { sym:'RBLX',  name:'Roblox',                sector:'Media' },
  { sym:'U',     name:'Unity Software',        sector:'Media' },
  { sym:'MTCH',  name:'Match Group',           sector:'Media' },
  // Telecom
  { sym:'T',     name:'AT&T',                  sector:'Telecom' },
  { sym:'VZ',    name:'Verizon',               sector:'Telecom' },
  { sym:'TMUS',  name:'T-Mobile US',           sector:'Telecom' },
  { sym:'CHTR',  name:'Charter Communications',sector:'Telecom' },
  { sym:'CMCSA', name:'Comcast',               sector:'Telecom' },
  { sym:'LBRDA', name:'Liberty Broadband',     sector:'Telecom' },
  { sym:'DISH',  name:'DISH Network',          sector:'Telecom' },
  // Pharma & Biotech
  { sym:'JNJ',   name:'Johnson and Johnson',   sector:'Pharma' },
  { sym:'PFE',   name:'Pfizer',                sector:'Pharma' },
  { sym:'MRK',   name:'Merck',                 sector:'Pharma' },
  { sym:'ABBV',  name:'AbbVie',                sector:'Pharma' },
  { sym:'LLY',   name:'Eli Lilly',             sector:'Pharma' },
  { sym:'BMY',   name:'Bristol-Myers Squibb',  sector:'Pharma' },
  { sym:'AMGN',  name:'Amgen',                 sector:'Pharma' },
  { sym:'GILD',  name:'Gilead Sciences',       sector:'Pharma' },
  { sym:'BIIB',  name:'Biogen',                sector:'Pharma' },
  { sym:'REGN',  name:'Regeneron',             sector:'Pharma' },
  { sym:'VRTX',  name:'Vertex Pharma',         sector:'Pharma' },
  { sym:'MRNA',  name:'Moderna',               sector:'Pharma' },
  { sym:'BNTX',  name:'BioNTech',              sector:'Pharma' },
  { sym:'ALNY',  name:'Alnylam Pharma',        sector:'Pharma' },
  { sym:'INCY',  name:'Incyte',                sector:'Pharma' },
  { sym:'IONS',  name:'Ionis Pharma',          sector:'Pharma' },
  { sym:'EXEL',  name:'Exelixis',              sector:'Pharma' },
  // Medical Devices
  { sym:'MDT',   name:'Medtronic',             sector:'MedTech' },
  { sym:'ABT',   name:'Abbott Laboratories',   sector:'MedTech' },
  { sym:'ISRG',  name:'Intuitive Surgical',    sector:'MedTech' },
  { sym:'BSX',   name:'Boston Scientific',     sector:'MedTech' },
  { sym:'EW',    name:'Edwards Lifesciences',  sector:'MedTech' },
  { sym:'SYK',   name:'Stryker',               sector:'MedTech' },
  { sym:'ZBH',   name:'Zimmer Biomet',         sector:'MedTech' },
  { sym:'BAX',   name:'Baxter International',  sector:'MedTech' },
  { sym:'BDX',   name:'Becton Dickinson',      sector:'MedTech' },
  { sym:'DXCM',  name:'Dexcom',                sector:'MedTech' },
  { sym:'PODD',  name:'Insulet',               sector:'MedTech' },
  { sym:'HOLX',  name:'Hologic',               sector:'MedTech' },
  { sym:'IDXX',  name:'IDEXX Laboratories',    sector:'MedTech' },
  // Health Insurance & Services
  { sym:'UNH',   name:'UnitedHealth Group',    sector:'Health Svcs' },
  { sym:'CVS',   name:'CVS Health',            sector:'Health Svcs' },
  { sym:'CI',    name:'Cigna',                 sector:'Health Svcs' },
  { sym:'ELV',   name:'Elevance Health',       sector:'Health Svcs' },
  { sym:'HUM',   name:'Humana',                sector:'Health Svcs' },
  { sym:'MOH',   name:'Molina Healthcare',     sector:'Health Svcs' },
  { sym:'CNC',   name:'Centene',               sector:'Health Svcs' },
  { sym:'HCA',   name:'HCA Healthcare',        sector:'Health Svcs' },
  { sym:'DGX',   name:'Quest Diagnostics',     sector:'Health Svcs' },
  { sym:'LH',    name:'Labcorp',               sector:'Health Svcs' },
  // Energy: Oil & Gas
  { sym:'XOM',   name:'ExxonMobil',            sector:'Energy' },
  { sym:'CVX',   name:'Chevron',               sector:'Energy' },
  { sym:'COP',   name:'ConocoPhillips',        sector:'Energy' },
  { sym:'EOG',   name:'EOG Resources',         sector:'Energy' },
  { sym:'SLB',   name:'SLB',                   sector:'Energy' },
  { sym:'HAL',   name:'Halliburton',           sector:'Energy' },
  { sym:'BKR',   name:'Baker Hughes',          sector:'Energy' },
  { sym:'PSX',   name:'Phillips 66',           sector:'Energy' },
  { sym:'VLO',   name:'Valero Energy',         sector:'Energy' },
  { sym:'MPC',   name:'Marathon Petroleum',    sector:'Energy' },
  { sym:'OXY',   name:'Occidental Petroleum',  sector:'Energy' },
  { sym:'DVN',   name:'Devon Energy',          sector:'Energy' },
  { sym:'FANG',  name:'Diamondback Energy',    sector:'Energy' },
  { sym:'MRO',   name:'Marathon Oil',          sector:'Energy' },
  { sym:'APA',   name:'APA Corporation',       sector:'Energy' },
  // Utilities & Renewables
  { sym:'NEE',   name:'NextEra Energy',        sector:'Utilities' },
  { sym:'DUK',   name:'Duke Energy',           sector:'Utilities' },
  { sym:'SO',    name:'Southern Company',      sector:'Utilities' },
  { sym:'AEP',   name:'American Electric Pwr', sector:'Utilities' },
  { sym:'EXC',   name:'Exelon',                sector:'Utilities' },
  { sym:'XEL',   name:'Xcel Energy',           sector:'Utilities' },
  { sym:'PCG',   name:'PG&E',                  sector:'Utilities' },
  { sym:'ED',    name:'Consolidated Edison',   sector:'Utilities' },
  { sym:'ENPH',  name:'Enphase Energy',        sector:'Utilities' },
  { sym:'FSLR',  name:'First Solar',           sector:'Utilities' },
  { sym:'RUN',   name:'Sunrun',                sector:'Utilities' },
  { sym:'BE',    name:'Bloom Energy',          sector:'Utilities' },
  { sym:'PLUG',  name:'Plug Power',            sector:'Utilities' },
  // Aerospace & Defence
  { sym:'BA',    name:'Boeing',                sector:'Aerospace' },
  { sym:'LMT',   name:'Lockheed Martin',       sector:'Aerospace' },
  { sym:'RTX',   name:'RTX Corporation',       sector:'Aerospace' },
  { sym:'NOC',   name:'Northrop Grumman',      sector:'Aerospace' },
  { sym:'GD',    name:'General Dynamics',      sector:'Aerospace' },
  { sym:'LHX',   name:'L3Harris Technologies', sector:'Aerospace' },
  { sym:'HII',   name:'Huntington Ingalls',    sector:'Aerospace' },
  { sym:'KTOS',  name:'Kratos Defense',        sector:'Aerospace' },
  { sym:'RKLB',  name:'Rocket Lab',            sector:'Aerospace' },
  { sym:'AXON',  name:'Axon Enterprise',       sector:'Aerospace' },
  { sym:'LDOS',  name:'Leidos Holdings',       sector:'Aerospace' },
  { sym:'SAIC',  name:'SAIC',                  sector:'Aerospace' },
  // Industrials
  { sym:'GE',    name:'GE Aerospace',          sector:'Industrials' },
  { sym:'HON',   name:'Honeywell',             sector:'Industrials' },
  { sym:'MMM',   name:'3M',                    sector:'Industrials' },
  { sym:'CAT',   name:'Caterpillar',           sector:'Industrials' },
  { sym:'DE',    name:'Deere and Company',     sector:'Industrials' },
  { sym:'EMR',   name:'Emerson Electric',      sector:'Industrials' },
  { sym:'ETN',   name:'Eaton',                 sector:'Industrials' },
  { sym:'ITW',   name:'Illinois Tool Works',   sector:'Industrials' },
  { sym:'PH',    name:'Parker Hannifin',       sector:'Industrials' },
  { sym:'ROK',   name:'Rockwell Automation',   sector:'Industrials' },
  { sym:'FDX',   name:'FedEx',                 sector:'Industrials' },
  { sym:'UPS',   name:'UPS',                   sector:'Industrials' },
  { sym:'XPO',   name:'XPO Logistics',         sector:'Industrials' },
  { sym:'ODFL',  name:'Old Dominion Freight',  sector:'Industrials' },
  { sym:'JBHT',  name:'J.B. Hunt Transport',   sector:'Industrials' },
  { sym:'CSX',   name:'CSX Corporation',       sector:'Industrials' },
  { sym:'UNP',   name:'Union Pacific',         sector:'Industrials' },
  { sym:'NSC',   name:'Norfolk Southern',      sector:'Industrials' },
  { sym:'CNI',   name:'Canadian National Rwy', sector:'Industrials' },
  { sym:'WAB',   name:'Wabtec',                sector:'Industrials' },
  { sym:'CHRW',  name:'C.H. Robinson',         sector:'Industrials' },
  { sym:'EXPD',  name:'Expeditors Intl',       sector:'Industrials' },
  // Real Estate (REITs)
  { sym:'AMT',   name:'American Tower',        sector:'REITs' },
  { sym:'PLD',   name:'Prologis',              sector:'REITs' },
  { sym:'CCI',   name:'Crown Castle',          sector:'REITs' },
  { sym:'EQIX',  name:'Equinix',               sector:'REITs' },
  { sym:'PSA',   name:'Public Storage',        sector:'REITs' },
  { sym:'EXR',   name:'Extra Space Storage',   sector:'REITs' },
  { sym:'WELL',  name:'Welltower',             sector:'REITs' },
  { sym:'VTR',   name:'Ventas',                sector:'REITs' },
  { sym:'O',     name:'Realty Income',         sector:'REITs' },
  { sym:'NNN',   name:'NNN REIT',              sector:'REITs' },
  { sym:'SPG',   name:'Simon Property Group',  sector:'REITs' },
  { sym:'ARE',   name:'Alexandria Real Estate', sector:'REITs' },
  { sym:'VICI',  name:'VICI Properties',       sector:'REITs' },
  { sym:'IRM',   name:'Iron Mountain',         sector:'REITs' },
  { sym:'DLR',   name:'Digital Realty Trust',  sector:'REITs' },
  { sym:'AVB',   name:'AvalonBay Communities', sector:'REITs' },
  { sym:'EQR',   name:'Equity Residential',    sector:'REITs' },
  // Materials & Mining
  { sym:'LIN',   name:'Linde',                 sector:'Materials' },
  { sym:'APD',   name:'Air Products',          sector:'Materials' },
  { sym:'SHW',   name:'Sherwin-Williams',       sector:'Materials' },
  { sym:'ECL',   name:'Ecolab',                sector:'Materials' },
  { sym:'NEM',   name:'Newmont',               sector:'Materials' },
  { sym:'FCX',   name:'Freeport-McMoRan',      sector:'Materials' },
  { sym:'NUE',   name:'Nucor',                 sector:'Materials' },
  { sym:'STLD',  name:'Steel Dynamics',        sector:'Materials' },
  { sym:'AA',    name:'Alcoa',                 sector:'Materials' },
  { sym:'MOS',   name:'Mosaic',                sector:'Materials' },
  { sym:'CF',    name:'CF Industries',         sector:'Materials' },
  { sym:'ALB',   name:'Albemarle',             sector:'Materials' },
  { sym:'MP',    name:'MP Materials',          sector:'Materials' },
  { sym:'GOLD',  name:'Barrick Gold',          sector:'Materials' },
  { sym:'AEM',   name:'Agnico Eagle Mines',    sector:'Materials' },
  { sym:'WPM',   name:'Wheaton Precious Metals',sector:'Materials' },
  // ETFs
  { sym:'SPY',   name:'S&P 500 ETF',           sector:'ETFs' },
  { sym:'QQQ',   name:'Nasdaq 100 ETF',        sector:'ETFs' },
  { sym:'DIA',   name:'Dow Jones ETF',         sector:'ETFs' },
  { sym:'IWM',   name:'Russell 2000 ETF',      sector:'ETFs' },
  { sym:'VTI',   name:'Total Market ETF',      sector:'ETFs' },
  { sym:'VOO',   name:'Vanguard S&P 500 ETF',  sector:'ETFs' },
  { sym:'VGT',   name:'Vanguard Tech ETF',     sector:'ETFs' },
  { sym:'GLD',   name:'Gold ETF',              sector:'ETFs' },
  { sym:'SLV',   name:'Silver ETF',            sector:'ETFs' },
  { sym:'USO',   name:'Oil ETF',               sector:'ETFs' },
  { sym:'TLT',   name:'20yr Treasury ETF',     sector:'ETFs' },
  { sym:'HYG',   name:'High Yield Bond ETF',   sector:'ETFs' },
  { sym:'XLF',   name:'Financial Select ETF',  sector:'ETFs' },
  { sym:'XLK',   name:'Technology ETF',        sector:'ETFs' },
  { sym:'XLE',   name:'Energy ETF',            sector:'ETFs' },
  { sym:'XLV',   name:'Health Care ETF',       sector:'ETFs' },
  { sym:'XLI',   name:'Industrial ETF',        sector:'ETFs' },
  { sym:'XLY',   name:'Consumer Discr ETF',    sector:'ETFs' },
  { sym:'XLP',   name:'Consumer Staples ETF',  sector:'ETFs' },
  { sym:'XLU',   name:'Utilities ETF',         sector:'ETFs' },
  { sym:'XLB',   name:'Materials ETF',         sector:'ETFs' },
  { sym:'XLRE',  name:'Real Estate ETF',       sector:'ETFs' },
  { sym:'SOXX',  name:'Semiconductor ETF',     sector:'ETFs' },
  { sym:'ARKK',  name:'ARK Innovation ETF',    sector:'ETFs' },
  { sym:'ARKG',  name:'ARK Genomics ETF',      sector:'ETFs' },
  { sym:'SOXL',  name:'Semi Bull 3x ETF',      sector:'ETFs' },
  { sym:'SOXS',  name:'Semi Bear 3x ETF',      sector:'ETFs' },
  { sym:'TQQQ',  name:'QQQ Bull 3x ETF',       sector:'ETFs' },
  { sym:'SQQQ',  name:'QQQ Bear 3x ETF',       sector:'ETFs' },
  { sym:'SPXL',  name:'S&P 500 Bull 3x ETF',   sector:'ETFs' },
  // ── European: UK (LSE) ───────────────────────────────────────────────
  { sym:'LSE:SHEL',  name:'Shell',                 sector:'Europe – UK' },
  { sym:'LSE:BP',    name:'BP',                    sector:'Europe – UK' },
  { sym:'LSE:HSBA',  name:'HSBC',                  sector:'Europe – UK' },
  { sym:'LSE:AZN',   name:'AstraZeneca',           sector:'Europe – UK' },
  { sym:'LSE:GSK',   name:'GSK',                   sector:'Europe – UK' },
  { sym:'LSE:ULVR',  name:'Unilever',              sector:'Europe – UK' },
  { sym:'LSE:DGE',   name:'Diageo',                sector:'Europe – UK' },
  { sym:'LSE:RIO',   name:'Rio Tinto',             sector:'Europe – UK' },
  { sym:'LSE:BHP',   name:'BHP Group',             sector:'Europe – UK' },
  { sym:'LSE:LLOY',  name:'Lloyds Banking Group',  sector:'Europe – UK' },
  { sym:'LSE:BARC',  name:'Barclays',              sector:'Europe – UK' },
  { sym:'LSE:STAN',  name:'Standard Chartered',    sector:'Europe – UK' },
  { sym:'LSE:VOD',   name:'Vodafone',              sector:'Europe – UK' },
  { sym:'LSE:BA',    name:'BAE Systems',           sector:'Europe – UK' },
  { sym:'LSE:RR',    name:'Rolls-Royce',           sector:'Europe – UK' },
  { sym:'LSE:NG',    name:'National Grid',         sector:'Europe – UK' },
  { sym:'LSE:SSE',   name:'SSE',                   sector:'Europe – UK' },
  { sym:'LSE:EXPN',  name:'Experian',              sector:'Europe – UK' },
  { sym:'LSE:REL',   name:'RELX',                  sector:'Europe – UK' },
  { sym:'LSE:BATS',  name:'British American Tobacco', sector:'Europe – UK' },
  // ── European: Germany (XETRA) ─────────────────────────────────────────
  { sym:'XETRA:SAP',  name:'SAP',                  sector:'Europe – DE' },
  { sym:'XETRA:SIE',  name:'Siemens',              sector:'Europe – DE' },
  { sym:'XETRA:ALV',  name:'Allianz',              sector:'Europe – DE' },
  { sym:'XETRA:MUV2', name:'Munich Re',            sector:'Europe – DE' },
  { sym:'XETRA:DTE',  name:'Deutsche Telekom',     sector:'Europe – DE' },
  { sym:'XETRA:BMW',  name:'BMW',                  sector:'Europe – DE' },
  { sym:'XETRA:MBG',  name:'Mercedes-Benz',        sector:'Europe – DE' },
  { sym:'XETRA:VOW3', name:'Volkswagen',           sector:'Europe – DE' },
  { sym:'XETRA:BAS',  name:'BASF',                 sector:'Europe – DE' },
  { sym:'XETRA:BAYN', name:'Bayer',                sector:'Europe – DE' },
  { sym:'XETRA:EOAN', name:'E.ON',                 sector:'Europe – DE' },
  { sym:'XETRA:RWE',  name:'RWE',                  sector:'Europe – DE' },
  { sym:'XETRA:DB1',  name:'Deutsche Börse',       sector:'Europe – DE' },
  { sym:'XETRA:DBK',  name:'Deutsche Bank',        sector:'Europe – DE' },
  { sym:'XETRA:MRK',  name:'Merck KGaA',           sector:'Europe – DE' },
  { sym:'XETRA:ADS',  name:'Adidas',               sector:'Europe – DE' },
  { sym:'XETRA:HEN3', name:'Henkel',               sector:'Europe – DE' },
  { sym:'XETRA:HEI',  name:'HeidelbergMaterials',  sector:'Europe – DE' },
  // ── European: France (EURONEXT) ───────────────────────────────────────
  { sym:'EURONEXT:MC',    name:'LVMH',             sector:'Europe – FR' },
  { sym:'EURONEXT:OR',    name:"L'Oréal",          sector:'Europe – FR' },
  { sym:'EURONEXT:TTE',   name:'TotalEnergies',    sector:'Europe – FR' },
  { sym:'EURONEXT:SAN',   name:'Sanofi',           sector:'Europe – FR' },
  { sym:'EURONEXT:AIR',   name:'Airbus',           sector:'Europe – FR' },
  { sym:'EURONEXT:BNP',   name:'BNP Paribas',      sector:'Europe – FR' },
  { sym:'EURONEXT:ACA',   name:'Crédit Agricole',  sector:'Europe – FR' },
  { sym:'EURONEXT:CS',    name:'AXA',              sector:'Europe – FR' },
  { sym:'EURONEXT:SU',    name:'Schneider Electric',sector:'Europe – FR' },
  { sym:'EURONEXT:CAP',   name:'Capgemini',        sector:'Europe – FR' },
  { sym:'EURONEXT:DG',    name:'Vinci',            sector:'Europe – FR' },
  { sym:'EURONEXT:SGO',   name:'Saint-Gobain',     sector:'Europe – FR' },
  { sym:'EURONEXT:RI',    name:'Pernod Ricard',    sector:'Europe – FR' },
  { sym:'EURONEXT:KER',   name:'Kering',           sector:'Europe – FR' },
  { sym:'EURONEXT:HO',    name:'Thales',           sector:'Europe – FR' },
  // ── European: Switzerland (SIX) ──────────────────────────────────────
  { sym:'SIX:NESN',  name:'Nestlé',                sector:'Europe – CH' },
  { sym:'SIX:ROG',   name:'Roche',                 sector:'Europe – CH' },
  { sym:'SIX:NOVN',  name:'Novartis',              sector:'Europe – CH' },
  { sym:'SIX:ABBN',  name:'ABB',                   sector:'Europe – CH' },
  { sym:'SIX:UBSG',  name:'UBS Group',             sector:'Europe – CH' },
  { sym:'SIX:CSGN',  name:'Credit Suisse (CS Group)', sector:'Europe – CH' },
  { sym:'SIX:ZURN',  name:'Zurich Insurance',      sector:'Europe – CH' },
  { sym:'SIX:SREN',  name:'Swiss Re',              sector:'Europe – CH' },
  { sym:'SIX:LONN',  name:'Lonza Group',           sector:'Europe – CH' },
  { sym:'SIX:CFR',   name:'Richemont',             sector:'Europe – CH' },
  { sym:'SIX:SIKA',  name:'Sika',                  sector:'Europe – CH' },
  // ── European: Netherlands / Scandinavia / Other ───────────────────────
  { sym:'EURONEXT:ASML', name:'ASML',              sector:'Europe – NL' },
  { sym:'EURONEXT:PHIA', name:'Philips',           sector:'Europe – NL' },
  { sym:'EURONEXT:HEIA', name:'Heineken',          sector:'Europe – NL' },
  { sym:'EURONEXT:ING',  name:'ING Group',         sector:'Europe – NL' },
  { sym:'EURONEXT:RAND', name:'Randstad',          sector:'Europe – NL' },
  { sym:'NASDAQ:ERICB',  name:'Ericsson',          sector:'Europe – SE' },
  { sym:'NASDAQ:NOKSEK', name:'Nokia',             sector:'Europe – FI' },
  { sym:'XETRA:NOKIA',   name:'Nokia (Xetra)',     sector:'Europe – FI' },
  { sym:'SIX:GIVN',      name:'Givaudan',          sector:'Europe – CH' },
  { sym:'EURONEXT:EL',   name:'EssilorLuxottica',  sector:'Europe – FR' },
];

// Deduplicate
const _seenSyms = new Set();
const _deduped  = STOCK_WATCHLIST.filter(s => {
  if (_seenSyms.has(s.sym)) return false;
  _seenSyms.add(s.sym); return true;
});

let STOCK_PAIRS = _deduped.map(s => ({
  sym:s.sym, base:s.sym, name:s.name, sector:s.sector,
  p:0, ch:0, vol:'--', high24:0, low24:0, _open:0, isStock:true,
}));

let stockMode     = false;
let _quotesLoaded = false;

// Market hours
function _getMarketStatus() {
  const et   = new Date(new Date().toLocaleString('en-US',{timeZone:'America/New_York'}));
  const day  = et.getDay();
  const mins = et.getHours()*60+et.getMinutes();
  if(day===0||day===6) return {open:false,label:'Weekend'};
  if(mins<570)         return {open:false,label:'Pre-Market'};
  if(mins>=960)        return {open:false,label:'After-Hours'};
  return {open:true,label:'Market Open'};
}
function updateMarketStatusBadge() {
  const b = document.getElementById('marketStatusBadge');
  if(!b) return;
  const {open,label} = _getMarketStatus();
  b.textContent = label;
  b.className   = 'msw-badge '+(open?'open':'closed');
}

// Convert Yahoo interval string to milliseconds (live tick fallback)
function _stockResMs(interval) {
  const map = {'1m':60000,'2m':120000,'5m':300000,'15m':900000,'30m':1800000,
               '60m':3600000,'1h':3600000,'1d':86400000,'1wk':604800000,'1mo':2592000000};
  return map[interval] || 60000;
}

// WebSocket
let _stockWs=null, _stockConnected=false, _stockReconTimer=null, _subscribedSyms=new Set();

function startStockFeed() {
  if(_stockWs){try{_stockWs.close();}catch(_){}}
  _subscribedSyms.clear();
  _stockWs = new WebSocket(FINNHUB_WS);
  _stockWs.onopen = ()=>{
    _stockConnected=true; clearTimeout(_stockReconTimer);
    _subscribeStock(S.pair); setFeedStatus('live');
  };
  _stockWs.onmessage = e=>{
    const msg=JSON.parse(e.data);
    if(msg.type!=='trade'||!msg.data) return;
    msg.data.forEach(trade=>{
      const sym=trade.s, price=trade.p;
      const pair=STOCK_PAIRS.find(p=>p.sym===sym);
      if(!pair) return;
      prices[sym]=price; pair.p=price;
      if(pair._open>0) pair.ch=((price-pair._open)/pair._open)*100;
      if(stockMode&&sym===S.pair&&candles.length){
        const last = candles.at(-1);
        const cfg  = FINNHUB_TF_CFG[currentTF] || FINNHUB_TF_CFG['1D'];
        const iMs  = candles.length > 1
          ? candles.at(-1).t - candles.at(-2).t
          : (cfg.group ? cfg.group * 1000 : _stockResMs(cfg.interval));
        const nowMs = Date.now();
        if(nowMs >= last.t + iMs){
          const newT = last.t + iMs;
          candles.push({t:newT, o:price, h:price, l:price, c:price, v:trade.v||0});
        } else {
          last.c=price; last.h=Math.max(last.h,price); last.l=Math.min(last.l,price);
          last.v=(last.v||0)+(trade.v||0);
        }
        updateLiveTick(sym);
      }
    });
  };
  _stockWs.onerror=()=>setFeedStatus('error');
  _stockWs.onclose=()=>{
    _stockConnected=false;
    if(stockMode){setFeedStatus('reconnecting');_stockReconTimer=setTimeout(startStockFeed,4000);}
  };
}
function stopStockFeed(){
  clearTimeout(_stockReconTimer);
  if(_stockWs){try{_stockWs.close();}catch(_){}_stockWs=null;}
  _stockConnected=false; _subscribedSyms.clear();
}
function _subscribeStock(sym){
  if(!_stockWs||_stockWs.readyState!==WebSocket.OPEN) return;
  if(_subscribedSyms.has(sym)) return;
  _stockWs.send(JSON.stringify({type:'subscribe',symbol:sym}));
  _subscribedSyms.add(sym);
}
function _unsubscribeStock(sym){
  if(!_stockWs||_stockWs.readyState!==WebSocket.OPEN) return;
  _stockWs.send(JSON.stringify({type:'unsubscribe',symbol:sym}));
  _subscribedSyms.delete(sym);
}

// ── Batch quote loader — Finnhub REST /quote ─────────────────────────
// Finnhub free tier: 60 calls/min. We stagger with a small delay between
// batches and cache results so we don't hammer on every render.
let _quoteAbort = null;
const _QUOTE_BATCH = 10;   // Finnhub is per-symbol, so batch = parallel burst

// _updateStockRow removed — stock list rows no longer display live prices.

async function _fetchFinnhubQuote(pair, signal) {
  // Only fetch US stocks (no exchange prefix) — Finnhub free tier doesn't cover European exchanges
  if (pair.sym.includes(':')) return;
  const url = `${FINNHUB_REST}/quote?symbol=${encodeURIComponent(pair.sym)}&token=${FINNHUB_KEY}`;
  try {
    const resp = await fetch(url, { signal });
    if (!resp.ok) return;
    const q = await resp.json();
    // Finnhub returns { c: current, d: change, dp: %change, h: high, l: low, o: open, pc: prevClose }
    if (!q || !q.c) return;
    pair.p      = q.c;
    pair.ch     = q.dp || 0;
    pair.high24 = q.h  || q.c;
    pair.low24  = q.l  || q.c;
    pair._open  = q.o  || q.c;
    prices[pair.sym] = q.c;
    _updateStockRow(pair.sym);
    if (pair.sym === S.pair && typeof updateHdr === 'function') updateHdr();
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    // silently skip failures for individual symbols
  }
}

// Fetch a single stock quote immediately — called by selStock so the
// header shows a real price without waiting for the full batch scan.
async function _fetchQuoteNow(sym) {
  const pair = STOCK_PAIRS.find(p => p.sym === sym);
  if (!pair || sym.includes(':')) return;
  const url = `${FINNHUB_REST}/quote?symbol=${encodeURIComponent(sym)}&token=${FINNHUB_KEY}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return;
    const q = await resp.json();
    if (!q || !q.c) return;
    pair.p      = q.c;
    pair.ch     = q.dp || 0;
    pair.high24 = q.h  || q.c;
    pair.low24  = q.l  || q.c;
    pair._open  = q.o  || q.c;
    prices[sym] = q.c;
    _updateStockRow(sym);
    if (sym === S.pair && typeof updateHdr === 'function') updateHdr();
  } catch (_) {}
}

async function loadStockQuotes() {
  if (_quoteAbort) _quoteAbort.abort();
  _quoteAbort = new AbortController();
  const signal = _quoteAbort.signal;

  // Only load US stocks to respect free-tier rate limits
  const usPairs = STOCK_PAIRS.filter(p => !p.sym.includes(':'));

  for (let i = 0; i < usPairs.length; i += _QUOTE_BATCH) {
    if (signal.aborted || !stockMode) return;
    const batch = usPairs.slice(i, i + _QUOTE_BATCH);
    try {
      await Promise.all(batch.map(p => _fetchFinnhubQuote(p, signal)));
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
    // ~10 req/s — stay under 60/min free limit
    if (i + _QUOTE_BATCH < usPairs.length) await new Promise(r => setTimeout(r, 700));
  }
  _quotesLoaded = true;
  if (typeof renderStockPairs === 'function') renderStockPairs();
}

// ── Finnhub candle resolution mapping ────────────────────────────────
// Finnhub supported resolutions: 1,5,15,30,60,D,W,M
// For unsupported resolutions we fetch a finer resolution and aggregate.
const FINNHUB_TF_CFG = {
  '1m':  { res:'1',  days:5     },
  '3m':  { res:'1',  days:5,   group:180   },
  '5m':  { res:'5',  days:30   },
  '15m': { res:'15', days:60   },
  '30m': { res:'30', days:60   },
  '1h':  { res:'60', days:365  },
  '2h':  { res:'60', days:365, group:7200  },
  '4h':  { res:'60', days:365, group:14400 },
  '6h':  { res:'60', days:365, group:21600 },
  '12h': { res:'60', days:365, group:43200 },
  '1D':  { res:'D',  days:730  },
  '3D':  { res:'D',  days:730, group:259200 },
  '1W':  { res:'W',  days:1825 },
  '1M':  { res:'M',  days:3650 },
};

// Aggregate candles into coarser buckets (for e.g. 1m→3m, 1h→4h etc.)
function _aggregateCandles(raw, groupSecs) {
  if (!groupSecs || !raw.length) return raw;
  const out    = [];
  const anchor = Math.floor(raw[0].t / 1000);
  let bucket   = null;
  for (const c of raw) {
    const tSec   = Math.floor(c.t / 1000);
    const bIdx   = Math.floor((tSec - anchor) / groupSecs);
    const bStart = anchor + bIdx * groupSecs;
    if (!bucket || bucket.bStart !== bStart) {
      if (bucket) out.push(bucket.c);
      bucket = { bStart, c: { t: bStart * 1000, o: c.o, h: c.h, l: c.l, c: c.c, v: c.v } };
    } else {
      bucket.c.h  = Math.max(bucket.c.h, c.h);
      bucket.c.l  = Math.min(bucket.c.l, c.l);
      bucket.c.c  = c.c;
      bucket.c.v += c.v;
    }
  }
  if (bucket) out.push(bucket.c);
  return out;
}

let _stockKlineAbort = null;

async function loadStockKlines(sym, tf) {
  if (_stockKlineAbort) _stockKlineAbort.abort();
  _stockKlineAbort = new AbortController();
  const signal = _stockKlineAbort.signal;

  // European stocks: Finnhub free tier doesn't have candles for them — use sim
  if (sym.includes(':')) { _stockFallbackSim(sym); return; }

  const cfg  = FINNHUB_TF_CFG[tf] || FINNHUB_TF_CFG['1D'];
  const now  = Math.floor(Date.now() / 1000);
  const from = now - cfg.days * 86400;
  const url  = `${FINNHUB_REST}/stock/candle?symbol=${encodeURIComponent(sym)}&resolution=${cfg.res}&from=${from}&to=${now}&token=${FINNHUB_KEY}`;

  try {
    const resp = await fetch(url, { signal });
    if (signal.aborted || sym !== S.pair) return;
    if (!resp.ok) { _stockFallbackSim(sym); return; }
    const data = await resp.json();
    if (signal.aborted || sym !== S.pair) return;

    // Finnhub returns { s:'ok', t:[], o:[], h:[], l:[], c:[], v:[] }
    if (!data || data.s !== 'ok' || !Array.isArray(data.t) || !data.t.length) {
      console.warn('Finnhub no data for', sym, data?.s);
      _stockFallbackSim(sym);
      return;
    }

    let raw = [];
    for (let i = 0; i < data.t.length; i++) {
      const o = data.o[i], h = data.h[i], l = data.l[i], c = data.c[i], v = data.v[i];
      if (o == null || c == null) continue;
      raw.push({ t: data.t[i] * 1000, o, h, l, c, v: v || 0 });
    }
    if (!raw.length) { _stockFallbackSim(sym); return; }

    candles = _aggregateCandles(raw, cfg.group || 0);

    if (candles.length) {
      const last = candles.at(-1).c;
      prices[sym] = last;
      const pair = STOCK_PAIRS.find(p => p.sym === sym);
      if (pair) {
        pair.p = last;
        if (!pair._open) pair._open = raw[0].o;
      }
      if (typeof updateHdr === 'function') updateHdr();
    }
    drawChart(true);
  } catch (err) {
    if (err.name === 'AbortError') return;
    console.warn('loadStockKlines (Finnhub) failed:', err);
    if (sym === S.pair) _stockFallbackSim(sym);
  }
}
function _stockFallbackSim(sym){
  const base=prices[sym]||100; candles=[]; let p=base;
  for(let i=200;i>=0;i--){
    const o=p*(1+(Math.random()-.5)*.018), c=o*(1+(Math.random()-.5)*.022);
    const h=Math.max(o,c)*(1+Math.random()*.008), l=Math.min(o,c)*(1-Math.random()*.008);
    candles.push({o,h,l,c,v:Math.random()*2e6+1e5,t:Date.now()-i*60000}); p=c;
  }
  drawChart(true);
}

// Badge colours
const _SC={
  AAPL:'#1c1c1e,#48484a',MSFT:'#0067b8,#50a0f0',NVDA:'#76b900,#a8de00',
  GOOGL:'#4285f4,#80b0ff',AMZN:'#ff9900,#ffcc55',META:'#0668e1,#55aaff',
  TSLA:'#cc0000,#ff5555',NFLX:'#e50914,#ff6666',AMD:'#ed1c24,#ff7777',
  INTC:'#0071c5,#40a0ee',QCOM:'#3253dc,#6680ff',AVGO:'#cc3300,#ff6644',
  TXN:'#bb0000,#ee4444',MU:'#d4003f,#ff4477',AMAT:'#0071c5,#40a8e0',
  LRCX:'#006eb0,#40aaee',KLAC:'#005599,#4488cc',MRVL:'#006bb6,#40aaee',
  CRM:'#009edb,#55d4ff',ORCL:'#f00000,#ff5555',ADBE:'#fa0f00,#ff6655',
  NOW:'#62d84e,#a0f080',INTU:'#365ebf,#6688ee',WDAY:'#f0a500,#ffcc44',
  SNOW:'#29b5e8,#80d8ff',PLTR:'#111111,#444444',DDOG:'#774594,#aa66cc',
  MDB:'#13aa52,#40cc80',CRWD:'#f04e23,#ff8866',ZS:'#005daa,#4490dd',
  NET:'#f38020,#ffaa55',FTNT:'#ee0000,#ff5555',PANW:'#00c0e8,#55ddff',
  SHOP:'#5a8f00,#96bf48',BABA:'#ff6a00,#ffaa55',UBER:'#000000,#3a3a3a',
  LYFT:'#ff00bf,#ff66dd',ABNB:'#ff5a5f,#ff8888',DASH:'#ff3008,#ff7766',
  BKNG:'#003480,#4466bb',ETSY:'#f56400,#ff9944',EBAY:'#e53238,#ff6666',
  JPM:'#003da5,#4466cc',BAC:'#bb0020,#ee4466',WFC:'#d71e28,#ff5566',
  C:'#003b70,#4477bb',GS:'#4a6fa5,#7799cc',MS:'#215b8e,#5588bb',
  BLK:'#000000,#333333',BX:'#000000,#444444',V:'#1a1f71,#4466cc',
  MA:'#eb001b,#f79e1b',PYPL:'#003087,#4488cc',SQ:'#000000,#333333',
  COIN:'#0052ff,#5588ff',HOOD:'#00c805,#55ee55',WMT:'#0071ce,#40a8ee',
  COST:'#005dab,#4488cc',TGT:'#cc0000,#ff4444',HD:'#f96302,#ffaa55',
  LOW:'#004990,#4477bb',MCD:'#da291c,#ffbc0d',SBUX:'#00704a,#00b87a',
  NKE:'#111111,#555555',LULU:'#000000,#555555',GM:'#0170ce,#55aaee',
  F:'#003474,#4477cc',RIVN:'#5ba4ff,#99ccff',LCID:'#a0c4ff,#d0e8ff',
  NIO:'#00aeef,#55ccff',RACE:'#dc0000,#ff4444',DIS:'#113ccf,#4466ee',
  SPOT:'#1db954,#55dd88',WBD:'#000000,#444444',EA:'#ff4747,#ff8888',
  TTWO:'#be0000,#ee4444',RBLX:'#e8232a,#ff6666',T:'#00a8e0,#55ccff',
  VZ:'#cd040b,#ff5555',TMUS:'#e20074,#ff55bb',CMCSA:'#0063a5,#4488cc',
  JNJ:'#c8102e,#ee5577',PFE:'#0093d0,#55bbee',MRK:'#00857c,#00ccbb',
  ABBV:'#071d49,#4466aa',LLY:'#d52b1e,#ff5566',BMY:'#792f8a,#aa66bb',
  AMGN:'#0069a7,#4499cc',GILD:'#c8102e,#ee5577',REGN:'#f26522,#ffaa66',
  VRTX:'#6d2077,#aa55bb',MRNA:'#970a8f,#cc55cc',MDT:'#0077c8,#55aaee',
  ABT:'#0079c1,#55aaee',ISRG:'#1b4596,#4466cc',UNH:'#316bbe,#6699ee',
  CVS:'#cc0000,#ff4444',XOM:'#c8102e,#ee5577',CVX:'#0073cf,#55aaee',
  COP:'#e31937,#ff5566',SLB:'#00a3e0,#55ccff',HAL:'#c8102e,#ee5577',
  NEE:'#009cde,#55ccff',ENPH:'#ec6408,#ffaa55',FSLR:'#005dab,#4488cc',
  BA:'#0062a0,#4488cc',LMT:'#0066b2,#4499cc',RTX:'#005695,#4488cc',
  NOC:'#005695,#4488cc',GD:'#003b7a,#4466bb',GE:'#3b77bc,#6699dd',
  HON:'#eb2026,#ff5566',CAT:'#ffcd11,#ffe055',DE:'#367c2b,#66aa55',
  FDX:'#4d148c,#8855cc',UPS:'#351c15,#7a5c4f',AMT:'#1f2e6e,#4466bb',
  EQIX:'#0066a1,#4499cc',PSA:'#ff6600,#ffaa44',PLD:'#003087,#4488cc',
  LIN:'#005596,#4488cc',NEM:'#005b9a,#4488cc',FCX:'#0071bc,#55aaee',
  ALB:'#2d6e9e,#55aacc',GOLD:'#cfb53b,#f0d060',
  SPY:'#c41230,#ff4455',QQQ:'#0064a4,#4499dd',DIA:'#336699,#6688bb',
  IWM:'#224488,#5577aa',GLD:'#cfb53b,#f0d060',SLV:'#aaaaaa,#cccccc',
  TLT:'#2255aa,#5588dd',ARKK:'#000000,#444444',SOXX:'#7b2d8b,#aa55cc',
  TQQQ:'#0064a4,#55aaff',SQQQ:'#cc0000,#ff5555',
};
const _LIGHT_SYMS=new Set(['NVDA','SHOP','MCD','CAT','GLD','SLV','SNAP','RIVN','DE','LCID']);

// Strip exchange prefix (e.g. "LSE:SHEL" → "SHEL") for display.
function _dispSym(sym){ return sym.includes(':') ? sym.split(':')[1] : sym; }
// Exchange label for header (e.g. "LSE:SHEL" → "LSE")
function _exchLabel(sym){ return sym.includes(':') ? sym.split(':')[0] : 'NYSE/NASDAQ'; }

function _stockBadgeStyle(sym){
  const base=_dispSym(sym);
  const g=_SC[base]||_SC[sym];
  if(g){const[a,b]=g.split(',');return `background:linear-gradient(135deg,${a},${b});color:${_LIGHT_SYMS.has(base)?'#000':'#fff'}`;}
  let h=0;for(let i=0;i<sym.length;i++)h=(h*31+sym.charCodeAt(i))&0xffffffff;
  const hue=Math.abs(h)%360;
  return `background:linear-gradient(135deg,hsl(${hue},60%,25%),hsl(${(hue+30)%360},70%,45%));color:#fff`;
}

// selStock
function selStock(sym){
  if(typeof klineAbort!=='undefined'&&klineAbort) klineAbort.abort();
  if(_stockKlineAbort) _stockKlineAbort.abort();
  stockMode=true; S.pair=sym;
  const pair=STOCK_PAIRS.find(p=>p.sym===sym); if(!pair) return;
  const disp=_dispSym(sym);
  const exch=_exchLabel(sym);
  const symEl=document.getElementById('hSym');
  if(symEl) symEl.innerHTML=`${pair.name}<span class="sym-sep"> / USD</span><span class="sym-meta"> · ${currentTF} · ${exch}</span>`;
  const unitEl=document.getElementById('aunit'); if(unitEl) unitEl.textContent=disp;
  const placeBtn=document.getElementById('placeBtn');
  if(placeBtn) placeBtn.textContent=(S.side==='buy'?'BUY ':'SELL ')+disp;
  candles=[]; _chartInitialised=false;
  if(typeof priceLine!=='undefined'&&priceLine&&candleSeries){try{candleSeries.removePriceLine(priceLine);}catch(_){}priceLine=null;}
  if(typeof _resetPriceLineCache==='function') _resetPriceLineCache();
  if(candleSeries){try{candleSeries.setData([]);}catch(_){}}
  if(typeof volumeSeries!=='undefined'&&volumeSeries){try{volumeSeries.setData([]);}catch(_){}}
  if(typeof maLines!=='undefined') maLines.forEach(ma=>{if(ma.series){try{ma.series.setData([]);}catch(_){}}});
  // Fetch live quote immediately so the header shows a real price right away,
  // rather than waiting for candle data or the slow batch scan to complete.
  _fetchQuoteNow(sym);
  loadStockKlines(sym,currentTF);
  // Update active highlight in-place — don't rebuild the whole list (would wipe loaded prices)
  const _sl=document.getElementById('stockPairList');
  if(_sl){
    _sl.querySelectorAll('.pi').forEach(r=>r.classList.remove('on'));
    const _ar=_sl.querySelector('[data-stock-sym="'+sym+'"]');
    if(_ar) _ar.classList.add('on');
  }
  if(typeof updateHdr==='function') updateHdr();
  _subscribeStock(sym);
}

// renderStockPairs — shows badge, symbol, name, and favorite star only (no live prices)
function renderStockPairs(filter=''){
  const el=document.getElementById('stockPairList'); if(!el) return;
  const q=(filter||'').toLowerCase();
  const list=STOCK_PAIRS.filter(p=>!q||p.sym.toLowerCase().includes(q)||p.name.toLowerCase().includes(q)||p.sector.toLowerCase().includes(q));
  if(!list.length){el.innerHTML='<div style="padding:20px 12px;text-align:center;color:var(--t3);font-size:11px">No results</div>';return;}
  const sectors={};
  list.forEach(p=>{if(!sectors[p.sector])sectors[p.sector]=[];sectors[p.sector].push(p);});
  let html='';
  Object.entries(sectors).forEach(([sector,pairs])=>{
    html+=`<div class="sb-section-lbl">${sector}</div>`;
    pairs.forEach(p=>{
      const disp=_dispSym(p.sym);
      const lbl=disp.length>5?disp.slice(0,5):disp;
      const isFav=typeof favorites!=='undefined'&&favorites.includes(p.sym);
      html+=`<div class="pi ${p.sym===S.pair&&stockMode?'on':''}" data-stock-sym="${p.sym}" onclick="selStock('${p.sym}')" style="justify-content:space-between">
        <div class="ci">
          <div class="stock-badge" style="${_stockBadgeStyle(p.sym)}">${lbl}</div>
          <div style="min-width:0">
            <div class="p-base">${disp}</div>
            <div class="p-quote" style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:9px">${p.name}</div>
          </div>
        </div>
        <span class="fav-star${isFav?' active':''}" data-sym="${p.sym}" onclick="event.stopPropagation();toggleFav('${p.sym}')" style="font-size:14px;cursor:pointer;padding:0 4px;color:${isFav?'#f59e0b':'var(--t3)'}" title="${isFav?'Remove favourite':'Add favourite'}">★</span>
      </div>`;
    });
  });
  el.innerHTML=html;
}

// _updateStockPricesOnly removed — stock list no longer shows live prices.

function switchToStocks(){
  stockMode=true; updateMarketStatusBadge(); startStockFeed();
  renderStockPairs();
  if(!_quotesLoaded) loadStockQuotes();
  const isAlreadyStock=STOCK_PAIRS.some(p=>p.sym===S.pair);
  if(!isAlreadyStock) selStock(STOCK_PAIRS[0].sym);
  if(typeof feedWs!=='undefined'&&feedWs){try{feedWs.close();}catch(_){}}
}
function switchToCrypto(){
  stockMode=false; stopStockFeed();
  if(typeof startFeed==='function') startFeed();
  const lastCrypto=PAIRS.find(p=>p.sym===S.pair)?S.pair:(PAIRS[0]?PAIRS[0].sym:'BTC/USDT');
  if(typeof selPair==='function') selPair(lastCrypto);
}

// Override genCandles for TF switching
const _stockOrigGenCandles=window.genCandles;
window.genCandles=function(){
  if(stockMode) loadStockKlines(S.pair,currentTF);
  else if(typeof _stockOrigGenCandles==='function') _stockOrigGenCandles();
};

// Quotes are loaded on-demand when the Stocks tab is opened (via switchToStocks → loadStockQuotes).
// No auto-load on startup and no periodic background refresh.