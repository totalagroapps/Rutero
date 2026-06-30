with open("TotalApp/rutero-sam-frontend/js/api.js", "r", encoding="utf-8") as f:
    content = f.read()

history_func = """    async getTrackingHistory(vendedorId) {
        try {
            const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/tracking/history/${vendedorId}`);
            if (!response.ok) throw new Error("Error getting tracking history");
            return await response.json();
        } catch (error) {
            console.error("Error fetching history:", error);
            throw error;
        }
    },
"""

if "getTrackingHistory" not in content:
    idx = content.rfind("};")
    if idx != -1:
        content = content[:idx] + history_func + content[idx:]
        with open("TotalApp/rutero-sam-frontend/js/api.js", "w", encoding="utf-8") as f:
            f.write(content)
