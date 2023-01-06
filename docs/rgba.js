class RGBA {
    R;
    G;
    B;
    A;
    constructor(R = 0, G = 0, B = 0, A = 1) {
        this.R = R; this.B = B; this.G = G; this.A = A;
    }

    asHex() {
        return "#" + this.R.toString(16).padStart(2, "0") + this.G.toString(16).padStart(2, "0") + this.B.toString(16).padStart(2, "0");
    }

    /**
     * @returns {{H: number, S: number, V: number, A: number}}
     */
    asHSV() {
        let R01 = this.R / 255.0, G01 = this.G / 255.0, B01 = this.B / 255.0;
        let max = Math.max(R01, G01, B01);
        let min = Math.min(R01, G01, B01);
        let chroma = max - min;
        let hue = chroma === 0 ? 0 :
            R01 >= G01 && R01 >= B01 ? ((G01 - B01) / chroma) :
                G01 >= B01 && G01 >= R01 ? ((B01 - R01) / chroma) + 2 :
                    ((R01 - G01) / chroma) + 4;
        return {
            H: hue * 60,
            S: max === 0 ? 0 : chroma / max,
            V: max,
            A: this.A
        };
    }
    /**
     * @param {string} hex 
     * @returns {RGBA}
     */
    static fromHex(hex) {
        hex = hex.replace("#", "").trim();
        if (hex.length == 6)
            return new RGBA(Number.parseInt(hex.substring(0, 2), 16),
                Number.parseInt(hex.substring(2, 4), 16),
                Number.parseInt(hex.substring(4, 6), 16));
        else if (hex.length == 8)
            return new RGBA(Number.parseInt(hex.substring(0, 2), 16),
                Number.parseInt(hex.substring(2, 4), 16),
                Number.parseInt(hex.substring(4, 6), 16),
                Number.parseInt(hex.substring(6, 8), 16))
        else
            throw new Error("Invalid color hex string");
    }
    /**
     * @param {{R: number, G: number, B: number, A?: number}} obj 
     * @returns {RGBA}
     */
    static fromJSON(obj) {
        return new RGBA(obj.R, obj.G, obj.B, obj.A || 1);
    }
}