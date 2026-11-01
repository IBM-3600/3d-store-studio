import { Router, Request, Response } from 'express';
import integrationAssetRoutes from "./integration-asset.controller"
import IntegrationProductRoutes from "./integration-product.controller"

const router: Router = Router();


router.use("/assets",integrationAssetRoutes)
router.use("/products",IntegrationProductRoutes)


export default router