const http = require('http');

http.get('http://localhost:3000/api/now-showing', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.data && json.data.boxOffice) {
                console.log("BOX OFFICE SIZE:", json.data.boxOffice.length);
                console.log("BOX OFFICE [0]:", json.data.boxOffice[0]);
                console.log("NEW RELEASES [0]:", json.data.thisWeekNew[0]);
            } else {
                console.log("FAILED OR EMPTY:", data.substring(0, 500));
            }
        } catch(e) {
            console.log("JSON Parse error. Raw output:");
            console.log(data.substring(0, 500));
        }
    });
}).on("error", (err) => {
    console.log("Error: " + err.message);
});
