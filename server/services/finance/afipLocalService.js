const { LoginTicket, Wsfev1 } = require('afip-apis');
const path = require('path');
const fs = require('fs');

/**
 * Service to handle direct interaction with AFIP (WSAA and WSFE)
 * without using intermediate cloud APIs.
 */
class LocalAfipService {
    constructor(config) {
        this.cuit = config.cuit;
        this.certPath = config.cert;
        this.keyPath = config.key;
        this.production = config.production === true;
        this.wsaaUrl = this.production
            ? 'https://wsaa.afip.gov.ar/ws/services/LoginCms'
            : 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms';
        this.wsfeUrl = this.production
            ? 'https://servicos1.afip.gov.ar/wsfev1/service.asmx'
            : 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx';

        this.lt = new LoginTicket();
        this.wsfe = new Wsfev1(this.wsfeUrl);
        this.tokenData = null;

        // Use the same folder as the certificate to store the TA cache
        this.cacheFolder = path.dirname(this.certPath);
    }

    async getAuth() {
        const cacheName = `ta_${this.production ? 'prod' : 'dev'}.token`;
        const cachePath = path.join(this.cacheFolder, cacheName);

        // 1. Try to load from file cache
        if (fs.existsSync(cachePath)) {
            try {
                const cached = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
                if (new Date(cached.expirationTime) > new Date(Date.now() + 600000)) {
                    console.log(`[LocalAfipService] Using cached TA for ${this.cuit}`);
                    this.tokenData = cached;
                    return cached;
                }
            } catch (e) {
                console.warn("[LocalAfipService] Cache read error:", e.message);
            }
        }

        try {
            console.log(`[LocalAfipService] Requesting new TA from AFIP for ${this.cuit}...`);
            const res = await this.lt.wsaaLogin('wsfe', this.wsaaUrl, this.certPath, this.keyPath);
            console.log(`[LocalAfipService] WSAA Full Response: ${JSON.stringify(res)}`);

            // Extract token and sign from the correct structure
            const token = res.credentials?.token || res.token;
            const sign = res.credentials?.sign || res.sign;
            const expirationTime = res.header?.expirationTime || res.expirationTime;

            console.log(`[LocalAfipService] WSAA Response received. Expiration: ${expirationTime}`);

            this.tokenData = {
                token,
                sign,
                expirationTime
            };

            // 2. Save to file cache
            if (this.tokenData.token && this.tokenData.sign) {
                fs.writeFileSync(cachePath, JSON.stringify(this.tokenData));
                console.log(`[LocalAfipService] Valid TA saved to ${cachePath}`);
            } else {
                console.error("[LocalAfipService] Received EMPTY token data from WSAA!");
            }

            return this.tokenData;
        } catch (error) {
            if (error.extra?.fault?.faultcode === 'ns1:coe.alreadyAuthenticated' ||
                (error.message && error.message.includes('alreadyAuthenticated'))) {
                const msg = "AFIP indica que ya existe un token válido. Por seguridad, AFIP bloquea pedidos nuevos por unos minutos. Por favor, espera 2-5 minutos e intenta nuevamente.";
                console.warn(`[LocalAfipService] ${msg}`);
                throw new Error(msg, { cause: error });
            }
            console.error("[LocalAfipService] WSAA Error:", error);
            throw new Error(`Error de AFIP: ${error.message}`, { cause: error });
        }
    }

    async getServerStatus() {
        const auth = await this.getAuth();
        const input = {
            Auth: {
                Token: auth.token,
                Sign: auth.sign,
                Cuit: this.cuit
            }
        };

        try {
            const res = await this.wsfe.FEDummy(input, { url: this.wsfeUrl });
            // FEDummy returns AppServer, DbServer, AuthServer
            return res;
        } catch (err) {
            console.error("[LocalAfipService] WSFE FEDummy Error:", err);
            throw err;
        }
    }

    async getLastVoucher(ptoVta, cbteTipo) {
        const auth = await this.getAuth();
        const input = {
            Auth: {
                Token: auth.token,
                Sign: auth.sign,
                Cuit: this.cuit
            },
            PtoVta: ptoVta,
            CbteTipo: cbteTipo
        };

        try {
            console.log(`[LocalAfipService] Calling FECompUltimoAutorizado for PtoVta ${ptoVta}, Tipo ${cbteTipo}`);
            const res = await this.wsfe.FECompUltimoAutorizado(input, { url: this.wsfeUrl });
            console.log(`[LocalAfipService] FECompUltimoAutorizado Response: ${JSON.stringify(res)}`);

            if (res.Errors) {
                const error = Array.isArray(res.Errors.Err) ? res.Errors.Err[0] : res.Errors.Err;
                throw new Error(`AFIP Error: ${error.Msg} (Code: ${error.Code})`);
            }

            const cbteNro = (res && res.CbteNro !== undefined) ? res.CbteNro : (res?.FECompUltimoAutorizadoResult?.CbteNro);
            console.log(`[LocalAfipService] Returning CbteNro: ${cbteNro}`);
            return cbteNro;
        } catch (err) {
            console.error("[LocalAfipService] getLastVoucher Error:", err);
            if (err.extra?.fault) {
                console.error("[LocalAfipService] SOAP Fault Detail:", JSON.stringify(err.extra.fault));
            }
            throw err;
        }
    }

    async createVoucher(data) {
        const auth = await this.getAuth();
        const input = {
            Auth: {
                Token: auth.token,
                Sign: auth.sign,
                Cuit: this.cuit
            },
            FeCAEReq: {
                FeCabReq: {
                    CantReg: data.CantReg,
                    PtoVta: data.PtoVta,
                    CbteTipo: data.CbteTipo
                },
                FeDetReq: {
                    FECAEDetRequest: {
                        Concepto: data.Concepto,
                        DocTipo: data.DocTipo,
                        DocNro: data.DocNro,
                        CbteDesde: data.CbteDesde,
                        CbteHasta: data.CbteHasta,
                        CbteFch: data.CbteFch,
                        ImpTotal: data.ImpTotal,
                        ImpTotConc: data.ImpTotConc,
                        ImpNeto: data.ImpNeto,
                        ImpOpEx: data.ImpOpEx,
                        ImpTrib: data.ImpTrib,
                        ImpIVA: data.ImpIVA,
                        FchServDesde: data.FchServDesde,
                        FchServHasta: data.FchServHasta,
                        FchVtoPago: data.FchVtoPago,
                        MonId: data.MonId,
                        MonCotiz: data.MonCotiz,
                        CanMisMonExt: 'N', // RG 5616: 'S' for Same Currency, 'N' for Local Currency
                        CondicionIVAReceptorId: 5 // RG 5616: 5 = Consumidor Final
                    }
                }
            }
        };

        try {
            console.log(`[LocalAfipService] Calling FECAESolicitar for PtoVta ${data.PtoVta}, Tipo ${data.CbteTipo}, Nro ${data.CbteDesde}`);
            console.log(`[LocalAfipService] FECAESolicitar Request Input: ${JSON.stringify(input)}`);
            const res = await this.wsfe.FECAESolicitar(input, { url: this.wsfeUrl });
            console.log(`[LocalAfipService] FECAESolicitar Response: ${JSON.stringify(res)}`);

            // Handle nested result structure
            const result = res.FECAESolicitarResult || res;

            // Handle AFIP errors in response
            if (result.Errors) {
                const error = Array.isArray(result.Errors.Err) ? result.Errors.Err[0] : result.Errors.Err;
                throw new Error(`AFIP Error: ${error.Msg} (Code: ${error.Code})`);
            }

            const detResp = result.FeDetResp?.FECAEDetResponse || result.FECAEDetResponse;

            if (!detResp) {
                console.error("[LocalAfipService] No detalle found in:", JSON.stringify(result));
                throw new Error("Respuesta de AFIP no contiene detalles del comprobante.");
            }

            // Check for Observations in the response
            if (detResp.Resultado === 'R') {
                const obs = detResp.Observaciones?.Obs;
                const msg = Array.isArray(obs) ? obs.map(o => o.Msg).join(', ') : (obs?.Msg || 'Voucher rechazado sin mensaje');
                throw new Error(`AFIP Rechazo: ${msg}`);
            }

            return {
                CAE: detResp.CAE,
                CAEFchVto: detResp.CAEFchVto
            };
        } catch (err) {
            console.error("[LocalAfipService] createVoucher Error:", err);
            if (err.extra?.fault) {
                console.error("[LocalAfipService] SOAP Fault Detail:", JSON.stringify(err.extra.fault));
            }
            throw err;
        }
    }
}

module.exports = LocalAfipService;
