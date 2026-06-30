with open("TotalApp/rutero-sam-frontend/js/api.js", "r", encoding="utf-8") as f:
    content = f.read()

old_sync = """    async syncTracking(vendedorId, puntos) {
        if (!puntos || puntos.length === 0) return { total_insertados: 0, puntos: [] };
        try {
            const payload = { vendedor_id: vendedorId, puntos: puntos };
            const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/tracking/sync`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            return response;
        } catch (error) {"""

new_sync = """    async syncTracking(vendedorId, puntos) {
        if (!puntos || puntos.length === 0) return { total_insertados: 0, puntos: [] };
        try {
            const payload = { vendedor_id: vendedorId, puntos: puntos };
            const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/tracking/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error("Error sync tracking");
            return await response.json();
        } catch (error) {"""

content = content.replace(old_sync, new_sync)

old_latest = """    async getLatestTracking() {
        try {
            const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/tracking/latest`);
            return response;
        } catch (error) {"""

new_latest = """    async getLatestTracking() {
        try {
            const response = await this.fetchWithAuth(`${this.baseUrl}/api/v1/tracking/latest`);
            if (!response.ok) throw new Error("Error getting tracking");
            return await response.json();
        } catch (error) {"""

content = content.replace(old_latest, new_latest)

with open("TotalApp/rutero-sam-frontend/js/api.js", "w", encoding="utf-8") as f:
    f.write(content)
