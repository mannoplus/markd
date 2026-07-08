async function test() {
    const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent("海洋奇緣")}&language=zh-TW&page=1`;
    const res = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${process.env.TMDB_API_KEY}`,
            'accept': 'application/json'
        }
    });
    const data = await res.json();
    console.log(data);
}
test();
