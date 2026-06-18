// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  🦅 SAUDI ARABIA PUBG ULTRA PAC v8.0 "DESERT STORM" - COMPLETE
//  ⚡ Ultra-Low Latency | 🇸🇦 Geo-Optimized | 🔥 Multi-Failover
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

var CONFIG = {
    DNS_CACHE_TTL: 300000, IP_CACHE_TTL: 600000, ROUTE_CACHE_TTL: 120000,
    PROXY_ROTATION: 60000, MAX_CACHE_SIZE: 3000, LOBBY_TURBO_MODE: true,
    STRICT_SA_ONLY: true, FAILOVER_ENABLED: true, MATCHMAKING_LOCK: true
};

function createLRUCache(maxSize) {
    return {
        data: {}, order: [], maxSize: maxSize || CONFIG.MAX_CACHE_SIZE,
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
//  🇸🇦 PROXY POOL v3 - بروكسيات السعودية المحسّنة
// ══════════════════════════════════════════════════════════════════
var PROXY_POOL = [
    // ── TIER 0: VIP الرياض (< 2ms) ──
    { ip: "94.200.0.1",      port: 8443,  ping: 1.2, weight: 120, isp: "STC",     zone: "riyadh-core" },
    { ip: "212.138.0.1",     port: 20001, ping: 1.5, weight: 115, isp: "Mobily",  zone: "riyadh-north" },
    { ip: "105.30.0.1",      port: 20002, ping: 1.8, weight: 110, isp: "Zain SA", zone: "riyadh-south" },
    { ip: "188.50.0.1",      port: 443,   ping: 2.0, weight: 105, isp: "STC",     zone: "riyadh-east" },
    // ── TIER 1: جدة/الدمام (2-4ms) ──
    { ip: "94.200.128.1",    port: 443,   ping: 2.8, weight: 95,  isp: "Mobily",  zone: "jeddah" },
    { ip: "188.50.128.1",    port: 443,   ping: 3.5, weight: 85,  isp: "STC",     zone: "dammam" },
    { ip: "105.30.128.1",    port: 8443,  ping: 4.0, weight: 75,  isp: "Zain SA", zone: "mecca" },
    // ── TIER 2: مدن أخرى (4-8ms) ──
    { ip: "94.200.192.1",    port: 443,   ping: 5.8, weight: 60,  isp: "STC",     zone: "medina" },
    { ip: "188.50.192.1",    port: 443,   ping: 7.2, weight: 45,  isp: "Mobily",  zone: "taif" },
    // ── TIER 3: Backup ──
    { ip: "105.30.192.1",    port: 8080,  ping: 8.5, weight: 35,  isp: "Zain SA", zone: "abha" },
    { ip: "94.200.224.1",    port: 3128,  ping: 9.0, weight: 30,  isp: "STC",     zone: "tabuk" }
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
//  🌍 نطاقات IP السعودية - موسّعة 2025
// ══════════════════════════════════════════════════════════════════
var SA_NETS = [
    // STC
    ["94.200.0.0", "16"],   ["94.200.128.0", "17"],
    ["188.50.0.0", "16"],   ["188.50.128.0", "17"],
    ["212.138.0.0", "16"],  ["212.138.128.0", "17"],
    // Mobily
    ["105.30.0.0", "16"],   ["105.30.128.0", "17"],
    ["94.200.192.0", "18"], ["188.50.192.0", "18"],
    // Zain Saudi
    ["188.49.0.0", "16"],   ["188.49.128.0", "17"],
    ["105.31.0.0", "16"],   ["105.31.128.0", "17"],
    // نطاقات إضافية
    ["37.224.0.0", "16"],   ["37.225.0.0", "16"],
    ["37.226.0.0", "16"],   ["37.227.0.0", "16"],
    ["78.93.0.0", "16"],    ["78.94.0.0", "16"],
    ["84.235.0.0", "16"],   ["85.131.0.0", "16"],
    ["93.168.0.0", "16"],   ["95.177.0.0", "16"],
    ["109.82.0.0", "16"],   ["176.45.0.0", "16"],
    ["176.46.0.0", "16"],   ["176.47.0.0", "16"],
    // حكومي
    ["195.229.0.0", "16"],  ["195.230.0.0", "16"],
    // إضافية 2025
    ["178.86.0.0", "16"],   ["45.6.0.0", "16"],
    ["45.7.0.0", "16"],     ["45.8.0.0", "16"]
];

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
    "mea-*.pubgmobile.com", "me-*.pubgmobile.com", "sa-*.pubgmobile.com"
];

var LOBBY_CRITICAL = ["lobby", "match", "matchmaking", "region", "geo", "queue", "session", "room"];

function isLobbyCritical(host) {
    var h = host.toLowerCase();
    for (var i = 0; i < LOBBY_CRITICAL.length; i++) {
        if (h.indexOf(LOBBY_CRITICAL[i]) !== -1) return true;
    }
    return false;
}

function isSaudiIP(ip) {
    var cached = ipCache.get(ip);
    if (cached !== undefined) return cached;
    var result = false;
    for (var i = 0; i < SA_NETS.length; i++) {
        if (isInNet(ip, SA_NETS[i][0], maskFromCIDR(parseInt(SA_NETS[i][1])))) {
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
            
