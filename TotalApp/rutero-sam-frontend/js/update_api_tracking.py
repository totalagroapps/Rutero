with open("TotalApp/rutero-sam-frontend/js/api.js", "r", encoding="utf-8") as f:
    content = f.read()

funcs = """
    async syncTracking(vendedorId, puntos) {
        if (!puntos || puntos.length === 0) return { total_insertados: 0, puntos: [] };
        try {
            const payload = { vendedor_id: vendedorId, puntos: puntos };
            const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/tracking/sync`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            return response;
        } catch (error) {
            console.error("Error syncing tracking:", error);
            throw error;
        }
    },

    async getLatestTracking() {
        try {
            const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/tracking/latest`);
            return response;
        } catch (error) {
            console.error("Error fetching latest tracking:", error);
            throw error;
        }
    }
"""

if "syncTracking" not in content:
    idx = content.rfind("};")
    if idx != -1:
        content = content[:idx] + funcs + content[idx:]
        with open("TotalApp/rutero-sam-frontend/js/api.js", "w", encoding="utf-8") as f:
            f.write(content)
