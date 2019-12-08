const fs = require('fs');
const path = require('path');
const builder = require('xmlbuilder')

const staticUrls = [
    "",
    "/villagers",
    "/search",
    "/items/clothing",
    "/items/collectibles",
    "/items/equipment",
    "/items/all-furniture",
    "/items/nature",
    "/items/accessories",
    "/items/bottoms",
    "/items/dresses",
    "/items/hats",
    "/items/shoes",
    "/items/socks",
    "/items/tops",
    "/items/umbrellas",
    "/items/wetsuits",
    "/items/art",
    "/items/bugs",
    "/items/fish",
    "/items/fossils",
    "/items/balloons",
    "/items/stationery",
    "/items/usables",
    "/items/tools",
    "/items/flooring",
    "/items/furniture",
    "/items/music",
    "/items/wallpaper",
    "/items/bushes-trees",
    "/items/flowers",
    "/items/fruit",
    "/items/gyroids",
    "/items/mushrooms",
    "/items/ores"
];

class SiteMap {
    /**
     * Clears existing sitemaps directory and all files inside recursively.
     *
     * @param dir
     */
    clearDirectory(dir) {
        if (fs.existsSync(dir)) {
            fs.readdirSync(dir).forEach((file) => {
                const current = path.join(dir, file);
                if (fs.lstatSync(current).isDirectory()) {
                    this.clearDirectory(current);
                } else {
                    fs.unlinkSync(current);
                }
            });
            fs.rmdirSync(dir);
        }
    };

    /**
     * Recreates the public/sitemaps directory.
     *
     * @param dir
     */
    createDirectory(dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        } else {
            console.log('public/sitemaps already exists. Ignoring...')
        }
    }

    /**
     * Generate sitemaps and place them in the sitemaps directory.
     */
    generateMaps() {
        const villagers = fs.readdirSync(path.join('data', 'villagers'));
        const items = fs.readdirSync(path.join('data', 'items'));
        const pattern = "(.*)\.json";

        for (let i = 0; i < villagers.length; i++) {
            let name = "/villager/" + villagers[i].match(pattern)[1];
            villagers[i] = name;
        }

        for (let i = 0; i < items.length; i++) {
            let name = "/item/" + items[i].match(pattern)[1];
            items[i] = name;
        }

        let urlData = staticUrls.concat(villagers).concat(items);
        const siteMapXML = this.convertToXML(urlData);

        fs.appendFileSync(path.join('public', 'sitemaps', 'sitemap.xml'), siteMapXML);
    }

    /**
     * Builds the sitemap XML file based on given data.
     *
     * @param data
     * @returns {string}
     */
    convertToXML(data) {
        const xmlns = 'http://www.sitemaps.org/schemas/sitemap/0.9'
        let doc = builder.create('urlset')
            .att('xmlns', xmlns);
        for (let i = 0; i < data.length; i++) {
            const url = "https://villagerdb.com" + data[i];
            doc.ele('url')
                .ele('loc', url);
        }
        const xml = doc.end({ pretty: true});
        return xml;
    }

}



module.exports = new SiteMap();