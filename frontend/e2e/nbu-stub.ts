// The NBU stub as a process of its own, for Playwright's webServer in CI (playwright.config.ts)
import { NBU_STUB_PORT, startNbuStub } from './nbu.ts';

startNbuStub();
console.log(`NBU stub on http://localhost:${String(NBU_STUB_PORT)}`);
