
// using native fetch

const MODEL_NAMES = [
    "publishers/google/models/gemini-1.5-pro-001",
    "google/gemini-1.5-pro-001",
    "deepseek/deepseek-v3.2-maas",
    "deepseek/deepseek-v3-maas",
    "deepseek/deepseek-v3",
    "deepseek/deepseek-r1",
    "deepseek-ai/deepseek-v3",
    "deepseek-ai/deepseek-r1",
    "publishers/deepseek/models/deepseek-v3",
    "publishers/deepseek/models/deepseek-r1"
];

async function testModel(modelName) {
    console.log(`\n🧪 Testing: ${modelName}...`);
    try {
        const response = await fetch('http://localhost:3005/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer deepseek-vertex-bridge'
            },
            body: JSON.stringify({
                model: modelName,
                messages: [{ role: "user", content: "Who are you?" }]
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`✅ SUCCESS with ${modelName}!`);
            console.log(JSON.stringify(data, null, 2));
            return true;
        } else {
            console.log(`❌ FAILED (${response.status})`);
            try {
                const errorText = await response.text();
                // condensed output
                const err = JSON.parse(errorText);
                console.log(err.error?.message || errorText);
            } catch (e) { console.log("Could not parse error body"); }
            return false;
        }
    } catch (error) {
        console.error("❌ Network/Script Error:", error.message);
        return false;
    }
}

async function runTests() {
    for (const name of MODEL_NAMES) {
        if (await testModel(name)) break;
    }
}

runTests();
