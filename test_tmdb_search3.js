async function test() {
    const title = "海洋奇緣 Moana";
    let cleanTitle = title.replace(/[a-zA-Z:\-0-9\s]+$/, '').trim();
    if (!cleanTitle) cleanTitle = title.trim();
    
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}&language=zh-TW&page=1`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
        console.log("SUCCESS:", data.results[0].title, data.results[0].poster_path);
    } else {
        console.log("FAILED:", data);
    }
}
test();
