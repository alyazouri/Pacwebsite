// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  🦅 JORDAN PUBG ULTRA PAC v8.0 "PHOENIX STRIKE" - COMPLETE
//  ⚡ Ultra-Low Latency | 🇯🇴 Geo-Optimized | 🔥 Multi-Failover
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ══════════════════════════════════════════════════════════════════
//  ⚙️ CONFIG - الإعدادات الرئيسية
// ══════════════════════════════════════════════════════════════════
var CONFIG = {
    DNS_CACHE_TTL:        300000,
    IP_CACHE_TTL:         600000,
    ROUTE_CACHE_TTL:      120000,
    PROXY_ROTATION:       60000,
    MAX_CACHE_SIZE:       3000,
    LOBBY_TURBO_MODE:     true,
    STRICT_JO_ONLY:       true,
    FAILOVER_ENABLED:     true,
    MATCHMAKING_LOCK:     true
};

// ══════════════════════════════════════════════════════════════════
//  🚀 LRU CACHE - كاش ذكي بحد أقصى
// ══════════════════════════════════════════════════════════════════
function createLRUCache(maxSize) {
    return {
        data: {},
        order: [],
        maxSize: maxSize || CONFIG.MAX_CACHE_SIZE,
        get: function(key) {
            var entry = this.data[key];
            if (entry && (Date.now() - entry.time) < entry.ttl) {
                var idx = this.order.indexOf(key);
                if (idx > -1) this.order.splice(idx, 1);
                this.order.push(key);
                return entry.value;
            }
            if (entry) delete this.data[key];
            return undefined;
        },
        set: function(key, value, ttl) {
            if (Object.keys(this.data).length >= this.maxSize) {
                var oldest = this.order.shift();
                if (oldest) delete this.data[oldest];
            }
            this.data[key] = { value: value, time: Date.now(), ttl: ttl || CONFIG.DNS_CACHE_TTL };
            this.order.push(key);
        }
    };
}

var dnsCache = createLRUCache(1000);
var ipCache = createLRUCache(2000);
var routeCache = createLRUCache(CONFIG.MAX_CACHE_SIZE);

// ══════════════════════════════════════════════════════════════════
//  🇯🇴 PROXY POOL v3 - بروكسيات الأردن المحسّنة
// ══════════════════════════════════════════════════════════════════
var PROXY_POOL = [
    // ── TIER 0: VIP عمان (< 2ms) ──
    { ip: "188.247.0.1",     port: 8443,  ping: 1.2, weight: 120, isp: "JT",      zone: "amman-core" },
    { ip: "94.127.211.6",    port: 20001, ping: 1.5, weight: 115, isp: "Orange",  zone: "amman-west" },
    { ip: "94.127.211.7",    port: 20002, ping: 1.8, weight: 110, isp: "Orange",  zone: "amman-east" },
    { ip: "109.237.193.187", port: 443,   ping: 2.0, weight: 105, isp: "Zain",    zone: "amman-north" },
    // ── TIER 1: عمان الكبرى (2-4ms) ──
    { ip: "212.35.85.26",    port: 443,   ping: 2.8, weight: 95,  isp: "Umniah",  zone: "amman-south" },
    { ip: "149.200.136.6",   port: 443,   ping: 3.5, weight: 85,  isp: "Orange",  zone: "zarqa" },
    { ip: "79.173.192.10",   port: 8443,  ping: 4.0, weight: 75,  isp: "Zain",    zone: "irbid" },
    // ── TIER 2: مدن أخرى (4-8ms) ──
    { ip: "91.106.0.1",      port: 443,   ping: 5.8, weight: 60,  isp: "GO",      zone: "salt" },
    { ip: "82.212.128.10",   port: 443,   ping: 7.2, weight: 45,  isp: "GO",      zone: "aqaba" },
    // ── TIER 3: Backup ──
    { ip: "185.105.96.1",    port: 8080,  ping: 8.5, weight: 35,  isp: "Zain",    zone: "backup-1" },
    { ip: "89.42.208.5",     port: 3128,  ping: 9.0, weight: 30,  isp: "Umniah",  zone: "backup-2" }
];

var PROXY_STATS = {};
for (var i = 0; i < PROXY_POOL.length; i++) {
    PROXY_STATS[PROXY_POOL[i].ip] = {
        success: 0, fails: 0, lastUsed: 0,
        blacklisted: false, blacklistUntil: 0,
        dynamicWeight: PROXY_POOL[i].weight
    };
}

// ══════════════════════════════════════════════════════════════════
//  🌍 نطاقات IP الأردنية - موسّعة 2025
// ══════════════════════════════════════════════════════════════════
var JO_NETS = [
    // Orange Jordan
    ["94.127.208.0", "20"], ["94.127.211.0", "24"],
    ["46.185.128.0", "17"], ["46.185.144.0", "20"],
    ["188.247.0.0", "16"],  ["188.247.128.0", "17"],
    ["149.200.136.0", "24"], ["149.200.128.0", "20"],
    // Zain Jordan
    ["109.237.192.0", "18"], ["109.237.224.0", "19"],
    ["79.173.192.0", "18"],  ["79.173.224.0", "19"],
    ["185.105.96.0", "22"],
    // Umniah
    ["212.35.64.0", "18"],  ["212.35.85.0", "24"],
    ["212.35.96.0", "19"],  ["176.28.0.0", "15"],
    ["176.30.0.0", "16"],   ["89.42.208.0", "20"],
    // GO / Damamax
    ["91.106.0.0", "16"],   ["91.106.128.0", "17"],
    ["82.212.0.0", "16"],   ["82.212.128.0", "17"],
    // نطاقات إضافية
    ["37.220.0.0", "16"],   ["94.230.0.0", "16"],
    ["176.203.0.0", "16"],  ["217.165.0.0", "16"],
    ["213.139.0.0", "16"],  ["80.10.0.0", "16"],
    // حكومي وجامعات
    ["195.192.128.0", "17"], ["195.192.160.0", "19"],
    ["195.192.192.0", "18"], ["193.188.64.0", "19"],
    // إضافية 2025
    ["178.134.0.0", "16"],  ["45.84.0.0", "16"]
];

// ══════════════════════════════════════════════════════════════════
//  🎮 PUBG DOMAINS - شاملة
// ══════════════════════════════════════════════════════════════════
var PUBG_DOMAINS = [
    "*.pubgmobile.com", "*.pubg.com", "*.pubgmobile.live",
    "*.tencent.com", "*.tencentgames.com",
    "*.gpubgm.com", "*.igamecj.com",
    "*.qcloud.com", "*.gtimg.com", "*.qq.com",
    "*.qpic.cn", "*.tencentyun.com", "*.myqcloud.com",
    "*.amazonaws.com", "*.cloudfront.net",
    "*.akamaized.net", "*.akamai.net",
    "*.level3.net", "*.edgecastcdn.net",
    "*.azureedge.net", "*.azure.com",
    "*.googleapis.com", "*.gstatic.com",
    "*.firebase.io", "*.firebaseio.com",
    "*.proximabeta.com", "*.krafton.com",
    "*.battlegroundsmobile.com", "*.pubgmobile.me"
];

var PUBG_MEA_SERVERS = [
    "*.pubgmobile.live", "*.pubgm.qq.com",
    "*.game.pubgmobile.com", "*.api.pubgmobile.com",
    "*.gpns.pubgmobile.com", "*.live.pubgmobile.com",
    "*.match.pubgmobile.com", "*.gameover.pubgmobile.com",
    "*.matchmaking.pubgmobile.com", "*.lobby.pubgmobile.com",
    "*.region.pubgmobile.com", "*.geo.pubgmobile.com",
    "mea-*.pubgmobile.com", "me-*.pubgmobile.com"
];

var LOBBY_CRITICAL = ["lobby", "match", "matchmaking", "region", "geo", "queue", "session", "room"];

function isLobbyCritical(host) {
    var h = host.toLowerCase();
    for (var i = 0; i < LOBBY_CRITICAL.length; i++) {
        if (h.indexOf(LOBBY_CRITICAL[i]) !== -1) return true;
    }
    return false;
}

function isJordanIP(ip) {
    var cached = ipCache.get(ip);
    if (cached !== undefined) return cached;
    var result = false;
    for (var i = 0; i < JO_NETS.length; i++) {
        if (isInNet(ip, JO_NETS[i][0], maskFromCIDR(parseInt(JO_NETS[i][1])))) {
            result = true;
            break;
        }
    }
    ipCache.set(ip, result, CONFIG.IP_CACHE_TTL);
    return result;
}

function maskFromCIDR(cidr) {
    var mask = 0;
    for (var i = 0; i < cidr; i++) mask = (mask << 1) | 1;
    mask = mask << (32 - cidr);
    return ((mask >>> 24) & 255) + "." + ((mask >>> 16) & 255) + "." +
           ((mask >>> 8) & 255) + "." + (mask & 255);
}

var proxyIndex = 0;
var lastRotation = 0;

function getHealthyProxies() {
    var now = Date.now();
    var healthy = [];
    for (var i = 0; i < PROXY_POOL.length; i++) {
        var stats = PROXY_STATS[PROXY_POOL[i].ip];
        if (stats.blacklisted && now < stats.blacklistUntil) continue;
        if (stats.blacklisted && now >= stats.blacklistUntil) {
            stats.blacklisted = false;
            stats.fails = Math.max(0, stats.fails - 2);
        }
        healthy.push(PROXY_POOL[i]);
    }
    return healthy.length > 0 ? healthy : PROXY_POOL;
}

function getWeightedProxy() {
    var healthy = getHealthyProxies();
    var totalWeight = 0;
    for (var i = 0; i < healthy.length; i++) {
        totalWeight += PROXY_STATS[healthy[i].ip].dynamicWeight;
    }
    var random = Math.random() * totalWeight;
    var currentWeight = 0;
    for (var i = 0; i < healthy.length; i++) {
        currentWeight += PROXY_STATS[healthy[i].ip].dynamicWeight;
        if (random <= currentWeight) return healthy[i];
    }
    return healthy[0];
}

function getBestProxy() {
    var now = Date.now();
    var proxy;
    if (now - lastRotation > CONFIG.PROXY_ROTATION) {
        proxyIndex = (proxyIndex + 1) % getHealthyProxies().length;
        lastRotation = now;
    }
    proxy = getWeightedProxy();
    PROXY_STATS[proxy.ip].lastUsed = now;
    PROXY_STATS[proxy.ip].success++;
    return "PROXY " + proxy.ip + ":" + proxy.port;
}

function buildSmartChain() {
    var healthy = getHealthyProxies();
    var chain = "";
    var usedISPs = {};
    var count = 0;
    for (var i = 0; i < healthy.length && count < 4; i++) {
        var p = healthy[i];
        if (!usedISPs[p.isp]) {
            if (chain.length > 0) chain += "; ";
            chain += "PROXY " + p.ip + ":" + p.port;
            usedISPs[p.isp] = true;
            count++;
        }
    }
    if (!CONFIG.STRICT_JO_ONLY) chain += "; DIRECT";
    return chain;
}

function buildLobbyTurboChain() {
    var chain = "PROXY " + PROXY_POOL[0].ip + ":" + PROXY_POOL[0].port;
    chain += "; PROXY " + PROXY_POOL[1].ip + ":" + PROXY_POOL[1].port;
    chain += "; PROXY " + PROXY_POOL[2].ip + ":" + PROXY_POOL[2].port;
    chain += "; PROXY " + PROXY_POOL[3].ip + ":" + PROXY_POOL[3].port;
    return chain;
}

function buildFailoverChain() {
    var healthy = getHealthyProxies();
    var chain = "";
    for (var i = 0; i < Math.min(5, healthy.length); i++) {
        if (chain.length > 0) chain += "; ";
        chain += "PROXY " + healthy[i].ip + ":" + healthy[i].port;
    }
    return chain;
}

var PUBG_KEYWORDS = ["pubg", "tencent", "gpubgm", "igamecj", "proximabeta", "krafton", "pubgm"];

function isPUBGDomain(host) {
    var h = host.toLowerCase();
    for (var i = 0; i < PUBG_KEYWORDS.length; i++) {
        if (h.indexOf(PUBG_KEYWORDS[i]) !== -1) return true;
    }
    for (var i = 0; i < PUBG_DOMAINS.length; i++) {
        if (shExpMatch(h, PUBG_DOMAINS[i])) return true;
    }
    return false;
}

function isMEAServer(host) {
    var h = host.toLowerCase();
    if (h.indexOf("mea") !== -1 || h.indexOf("middle-east") !== -1) return true;
    for (var i = 0; i < PUBG_MEA_SERVERS.length; i++) {
        if (shExpMatch(h, PUBG_MEA_SERVERS[i])) return true;
    }
    return false;
}

var BLOCKED_DOMAINS = [
    "*.cheatengine.org", "*.aimbot.com",
    "*.hack*", "*.cheat*", "*.exploit*",
    "*.gamehack*", "*.modmenu*",
    "*.pubghack*", "*.pubgcheat*"
];

function isBlockedDomain(host) {
    var h = host.toLowerCase();
    for (var i = 0; i < BLOCKED_DOMAINS.length; i++) {
        if (shExpMatch(h, BLOCKED_DOMAINS[i])) return true;
    }
    return false;
}

function FindProxyForURL(url, host) {
    try {
        if (!host || host.length === 0) return "DIRECT";
        var cachedRoute = routeCache.get(host);
        if (cachedRoute) return cachedRoute;
        if (isPlainHostName(host) ||
            isInNet(host, "10.0.0.0", "255.0.0.0") ||
            isInNet(host, "172.16.0.0", "255.240.0.0") ||
            isInNet(host, "192.168.0.0", "255.255.0.0") ||
            isInNet(host, "127.0.0.0", "255.0.0.0")) {
            routeCache.set(host, "DIRECT", CONFIG.ROUTE_CACHE_TTL);
            return "DIRECT";
        }
        if (isBlockedDomain(host)) return "PROXY 0.0.0.0:0";
        if (!isPUBGDomain(host)) {
            routeCache.set(host, "DIRECT", CONFIG.ROUTE_CACHE_TTL);
            return "DIRECT";
        }
        if (CONFIG.MATCHMAKING_LOCK && isLobbyCritical(host)) {
            var result = CONFIG.LOBBY_TURBO_MODE ? buildLobbyTurboChain() : buildSmartChain();
            routeCache.set(host, result, CONFIG.ROUTE_CACHE_TTL);
            return result;
        }
        var cachedIp = dnsCache.get(host);
        if (!cachedIp) {
            cachedIp = dnsResolve(host);
            if (cachedIp) dnsCache.set(host, cachedIp, CONFIG.DNS_CACHE_TTL);
        }
        if (cachedIp && isJordanIP(cachedIp)) {
            routeCache.set(host, "DIRECT", CONFIG.ROUTE_CACHE_TTL);
            return "DIRECT";
        }
        if (isMEAServer(host)) {
            var result = buildSmartChain();
            routeCache.set(host, result, CONFIG.ROUTE_CACHE_TTL);
            return result;
        }
        var result = CONFIG.STRICT_JO_ONLY ? buildSmartChain() : getBestProxy();
        routeCache.set(host, result, CONFIG.ROUTE_CACHE_TTL);
        return result;
    } catch (e) {
        return CONFIG.STRICT_JO_ONLY ? getBestProxy() : "DIRECT";
    }
}
