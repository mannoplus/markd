const cheerio = require('cheerio');
async function test() {
    const res = await fetch('https://app2.atmovies.com.tw/boxoffice/');
    const html = await res.text();
    const $ = cheerio.load(html);
    const boxOffice = [];
    $('tr').each((i, el) => {
        const a = $(el).find('td a[href^="/movie/"]');
        const title = a.text().trim().replace(/\s+/g, ' ');
        const link = a.attr('href') || '';
        if (title) {
            boxOffice.push({title, link});
        }
    });
    console.log(boxOffice.slice(0, 5));
    // Print the first few tr elements to see the structure
    console.log($('tr').eq(1).html());
}
test();
