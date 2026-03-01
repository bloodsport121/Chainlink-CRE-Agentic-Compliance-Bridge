import fetch from 'node-fetch';

async function testConnection() {
    console.log("Testing connection to Chainlink Skill Hub...");
    const SKILL_HUB_URL = "http://localhost:3002/tools";

    try {
        const response = await fetch(SKILL_HUB_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Successfully connected to Chainlink Skill Hub!");
        console.log(`Found ${data.length} skills available:`);
        data.forEach(skill => console.log(` - ${skill.name}: ${skill.description}`));
        return true;
    } catch (error) {
        console.error("Failed to connect to Chainlink Skill Hub.");
        console.error("Make sure the Skill Hub server is running on port 3002.");
        console.error("Error details:", error.message);
        return false;
    }
}

testConnection();
