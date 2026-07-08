const http = require('http');

http.get('http://localhost:3000/api/now-showing', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.data && json.data.thisWeekNew) {
                console.log("SUCCESS");
                console.log("Box Office Size:", json.data.boxOffice.length);
                console.log("New Releases Size:", json.data.thisWeekNew.length);
                console.log("First Run present?", !!json.data.firstRun);
                console.log("Box Office [0] Link:", json.data.boxOffice[0]?.link);
                console.log("New Releases [0] Link:", json.data.thisWeekNew[0]?.link);
            } else {
                console.log("FAILED OR EMPTY");
                console.log(data.substring(0, 500));
            }
        } catch(e) {
            console.log("JSON Parse error.");
            console.log(e.message);
        }
    });
}).on("error", (err) => {
    console.log("Error: " + err.message);
});
