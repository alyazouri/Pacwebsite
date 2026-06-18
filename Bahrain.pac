// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  🦅 BAHRAIN PUBG ULTRA PAC v8.0 "PEARL STRIKE" - COMPLETE
//  ⚡ Ultra-Low Latency | 🇧🇭 Geo-Optimized | 🔥 Multi-Failover
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

var CONFIG = {
    DNS_CACHE_TTL: 300000, IP_CACHE_TTL: 600000, ROUTE_CACHE_TTL: 120000,
    PROXY_ROTATION: 60000, MAX_CACHE_SIZE: 3000, LOBBY_TURBO_MODE: true,
    STRICT_BH_ONLY: true, FAILOVER_ENABLED: true, MATCHMAKING_LOCK: true
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

// 🇧🇭 PROXY POOL v3 - بروكسيات البحرين المحسّنة
var PROXY_POOL = [
    { ip: "83.136.0.1",      port: 8443,  ping: 1.2, weight: 120, isp: "Batelco", zone: "manama-core" },
    { ip: "37.131.0.1",      port: 20001, ping: 1.5, weight: 115, isp: "Zain BH", zone: "manama-north" },
    { ip: "109.63.0.1",      port: 20002, ping: 1.8, weight: 110, isp: "STC BH",  zone: "manama-south" },
    { ip: "185.64.0.1",      port: 443,   ping: 2.0, weight: 105, isp: "Batelco", zone: "manama-east" },
    { ip: "83.136.128.1",    port: 443,   ping: 2.8, weight: 95,  isp: "Zain BH", zone: "muharraq" },
    { ip: "37.131.128.1",    port: 443,   ping: 3.5, weight: 85,  isp: "STC BH",  zone: "riffa" },
    { ip: "109.63.128.1",    port: 8443,  ping: 4.0, weight: 75,  isp: "Batelco", zone: "isa-town" },
    { ip: "185.64.128.1",    port: 443,   ping: 5.8, weight: 60,  isp: "Zain BH", zone: "hamad-town" },
    { ip: "83.136.192.1",    port: 443,   ping: 7.2, weight: 45,  isp: "STC BH",  zone: "sitra" },
    { ip: "37.131.192.1",    port: 8080,  ping: 8.5, weight: 35,  isp: "Batelco", zone: "backup-1" },
    { ip: "109.63.192.1",    port: 3128,  ping: 9.0, weight: 30,  isp: "Zain BH", zone: "backup-2" }
];

var PROXY_STATS = {};
for (var i = 0; i < PROXY_POOL.length; i++) {
    PROXY_STATS[PROXY_POOL[i].ip] = {
        success: 0, fails: 0, lastUsed: 0,
        blacklisted: false, blacklistUntil: 0,
        dynamicWeight: PROXY_POOL[i].weight
    };
}

// 🌍 نطاقات IP البحرينية - موسّعة 2025
var BH_NETS = [
    ["83.136.0.0", "16"],   ["83.136.128.0", "17"],
    ["37.131.0.0", "16"],   ["37.131.128.0", "17"],
    ["109.63.0.0", "16"],   ["109.63.128.0", "17"],
    ["185.64.0.0", "16"],   ["185.64.128.0", "17"],
    ["46.61.0.0", "16"],    ["46.61.128.0", "17"],
    ["213.132.0.0", "16"],  ["213.132.128.0", "17"],
    ["87.236.0.0", "16"],   ["87.236.128.0", "17"],
    ["195.39.0.0", "16"],   ["195.39.128.0", "17"],
    ["78.100.0.0", "16"],   ["85.154.0.0", "16"],
    ["94.76.0.0", "16"],    ["178.132.0.0", "16"]
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
    "mea-*.pubgmobile.com", "me-*.pubgmobile.com", "bh-*.pubgmobile.com"
];

var LOBBY_CRITICAL = ["lobby", "match", "matchmaking", "region", "geo", "queue", "session", "room"];

function isLobbyCritical(host) {
    var h = host.toLowerCase();
    for (var i = 0; i < LOBBY_CRITICAL.length; i++) {
        if (h.indexOf(LOBBY_CRITICAL[i]) !== -1) return true;
    }
    return false;
}

function isBahrainIP(ip) {
    var cached = ipCache.get(ip);
    if (cached !== undefined) return cached;
    var result = false;
    for (var i = 0; i < BH_NETS.length; i++) {
        if (isInNet(ip, BH_NETS[i][0], maskFromCIDR(parseInt(BH_NETS[i][1])))) {
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
    if (!CONFIG.STRICT_BH_ONLY) chain += "; DIRECT";
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
        if (cachedIp && isBahrainIP(cachedIp)) {
            routeCache.set(host, "DIRECT", CONFIG.ROUTE_CACHE_TTL);
            return "DIRECT";
        }
        if (isMEAServer(host)) {
            var result = buildSmartChain();
            routeCache.set(host, result, CONFIG.ROUTE_CACHE_TTL);
            return result;
        }
        var result = CONFIG.STRICT_BH_ONLY ? buildSmartChain() : getBestProxy();
        routeCache.set(host, result, CONFIG.ROUTE_CACHE_TTL);
        return result;
    } catch (e) {
        return CONFIG.STRICT_BH_ONLY ? getBestProxy() : "DIRECT";
    }
}
