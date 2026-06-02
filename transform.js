const fs = require('fs');
const ctrlPath = '/home/jmro/Documentos/proyectos/secretary-app/server/controllers/finance/financeController.js';
let ctrl = fs.readFileSync(ctrlPath, 'utf8');

// Remove require transactionRepository
ctrl = ctrl.replace(/const transactionRepository = require\(['"]\.\.\/\.\.\/repositories\/finance\/transactionRepository['"]\);\n?/, '');

// Wrap in class
ctrl = ctrl.replace(/exports\.([a-zA-Z0-9_]+) = async \(req, res\) => {/g, '    $1 = async (req, res) => {');

const classHeader = `class FinanceController {
    constructor(transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

`;

// Add class wrapper
const firstMethodIndex = ctrl.indexOf('    getPricing');
ctrl = ctrl.substring(0, firstMethodIndex) + classHeader + ctrl.substring(firstMethodIndex);

// Add module.exports at the end
ctrl += `\n}\n\nmodule.exports = FinanceController;\n`;

// Replace transactionRepository usages
ctrl = ctrl.replace(/transactionRepository\./g, 'this.transactionRepository.');

fs.writeFileSync(ctrlPath, ctrl);

const routesPath = '/home/jmro/Documentos/proyectos/secretary-app/server/routes/finance/financeRoutes.js';
let routes = fs.readFileSync(routesPath, 'utf8');
routes = routes.replace(/const financeController = require\(['"]\.\.\/\.\.\/controllers\/finance\/financeController['"]\);\n?/, '');
routes = routes.replace(/module\.exports = router;/, 'return router;\n};\n');
routes = routes.replace(/const router = express\.Router\(\);/, 'module.exports = (financeController) => {\n    const router = express.Router();');
fs.writeFileSync(routesPath, routes);

const appPath = '/home/jmro/Documentos/proyectos/secretary-app/server/app.js';
let app = fs.readFileSync(appPath, 'utf8');
const deps = `
const transactionRepository = require('./repositories/finance/transactionRepository');
const FinanceController = require('./controllers/finance/financeController');
const financeController = new FinanceController(transactionRepository);
const financeRoutes = require('./routes/finance/financeRoutes')(financeController);
`;
app = app.replace(/app\.use\('\/api\/finances', require\('\.\/routes\/finance\/financeRoutes'\)\);/, deps + "app.use('/api/finances', financeRoutes);");
fs.writeFileSync(appPath, app);

