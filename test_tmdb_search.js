async function test() {
    const title = "海洋奇緣 Moana";
    // Clean up to just first block before English letters
    let cleanTitle = title.replace(/[a-zA-Z:\-0-9\s]+$/, '').trim();
    if (!cleanTitle) cleanTitle = title.trim(); // fallback if it was all English
    
    console.log("Original:", title);
    console.log("Cleaned:", cleanTitle);
    
    const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(cleanTitle)}&language=zh-TW&page=1`;
    const res = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${process.env.TMDB_API_KEY}`,
            'accept': 'application/json'
        }
    });
    const data = await res.json();
    console.log("Results for cleaned:", data.results ? data.results.length : 0);
    if (data.results && data.results.length > 0) {
        console.log("Found:", data.results[0].title, data.results[0].poster_path);
    }
}
test();
