
// using native fetch

const MODEL_NAME = "deepseek-ai/deepseek-v3.2-maas";

async function testDeepSeek() {
    console.log(`\n🧪 Testing Connection via Vertex Bridge (Model: ${MODEL_NAME})...`);

    try {
        const response = await fetch('http://localhost:3001/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer deepseek-vertex-bridge'
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: [
                    {
                        role: "user",
                        content: "Who are you?"
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.log("\n❌ Request Failed!");
            console.log("Status:", response.status);
            try {
                const errorJson = JSON.parse(errorText);
                console.log("Response Body:", JSON.stringify(errorJson, null, 2));
            } catch (e) {
                console.log("Response Body (Raw):", errorText);
            }
            return;
        }

        const data = await response.json();
        console.log("\n✅ Success!");
        console.log("Full Response:", JSON.stringify(data, null, 2));

        if (data.choices && data.choices.length > 0) {
            console.log("\n💬 Model Reply:");
            console.log(data.choices[0].message.content);
        } else {
            console.log("\n⚠️  No content in response choices.");
        }

    } catch (error) {
        console.log("\n❌ Test Error:", error.message);
    }
}

testDeepSeek();
